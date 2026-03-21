"use server";

import { prisma } from "lib/prisma";
import { createNotification } from "./notifications";
import { NotificationType } from "@prisma/client";

const LOOK_AHEAD_MS = 60 * 60 * 1000; // 1 hour
const EVENT_REMINDER_MINS = 5;
const DEDUP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function formatTravelDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Accepts userId as a parameter 
export async function checkUpcomingEventNotifications(userId: string) {
  try {
    if (!userId) return { success: false, error: "No userId" };

    console.log("🔔 checkUpcomingEventNotifications called for userId:", userId);

    const now = new Date();
    const lookAheadEnd = new Date(now.getTime() + LOOK_AHEAD_MS);

    console.log(
      "🔔 querying events between:",
      new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
      "and",
      lookAheadEnd.toISOString(),
    );

    const upcomingEvents = await prisma.event.findMany({
      where: {
        userId,
        allDay: false,
        start: {
          gte: new Date(now.getTime() - 60 * 60 * 1000),
          lte: lookAheadEnd,
        },
      },
    });

    console.log("🔔 events found:", upcomingEvents.length);

    for (const event of upcomingEvents) {
      const eventStart = new Date(event.start);
      const minsUntilEvent = (eventStart.getTime() - now.getTime()) / 60_000;

      console.log(
        `🔔 "${event.title}" | mins until: ${minsUntilEvent.toFixed(1)} | travelDuration: ${event.travelDuration} | eventNotifiedAt: ${event.eventNotifiedAt} | travelNotifiedAt: ${event.travelNotifiedAt}`,
      );

      // Travel notification 
      if (typeof event.travelDuration === "number" && event.travelDuration > 0) {
        const travelWindowStart = event.travelDuration;
        const shouldFireTravel =
        minsUntilEvent <= travelWindowStart &&
        !event.travelNotifiedAt;

        console.log(`🔔 shouldFireTravel: ${shouldFireTravel} (minsUntil: ${minsUntilEvent.toFixed(1)}, window: <=${travelWindowStart})`);

        if (shouldFireTravel) {
          const leaveTime = formatTime(
            new Date(eventStart.getTime() - event.travelDuration * 60_000),
          );
          const travelStr = formatTravelDuration(event.travelDuration);
          const destination = event.destLocationName || event.title;

          await createNotification(
            userId,
            "Time to Leave",
            `You need to leave now for "${event.title}". Journey to ${destination} takes ${travelStr} — leave by ${leaveTime}.`,
            NotificationType.WARNING,
          );

          await prisma.event.update({
            where: { id: event.id },
            data: { travelNotifiedAt: now },
          });

          console.log(`🔔 travel notification sent for "${event.title}"`);
        }
      }

      // Event starting soon notification 
      const shouldFireEventReminder =
        minsUntilEvent <= EVENT_REMINDER_MINS &&
        minsUntilEvent > 0 &&
        !event.eventNotifiedAt;

      console.log(`🔔 shouldFireEventReminder: ${shouldFireEventReminder} (minsUntil: ${minsUntilEvent.toFixed(1)})`);

      if (shouldFireEventReminder) {
        await createNotification(
          userId,
          "Event Starting Soon",
          `"${event.title}" starts in ${Math.round(minsUntilEvent)} minute${Math.round(minsUntilEvent) === 1 ? "" : "s"} at ${formatTime(eventStart)}.`,
          NotificationType.INFO,
        );

        await prisma.event.update({
          where: { id: event.id },
          data: { eventNotifiedAt: now },
        });

        console.log(`🔔 event reminder sent for "${event.title}"`);
      }
    }

    return { success: true };
  } catch (err) {
    console.error("🔔 checkUpcomingEventNotifications error:", err);
    return { success: false, error: "Failed to check event notifications" };
  }
}

export async function resetEventNotificationGuards(eventId: string) {
  try {
    await prisma.event.update({
      where: { id: eventId },
      data: {
        travelNotifiedAt: null,
        eventNotifiedAt: null,
      },
    });
    return { success: true };
  } catch (err) {
    console.error("resetEventNotificationGuards error:", err);
    return { success: false };
  }
}

export async function deleteEventNotifications(userId: string, eventTitle: string) {
  try {
    await prisma.notification.deleteMany({
      where: {
        userId,
        isRead: false,
        OR: [
          { title: "Time to Leave", message: { contains: `"${eventTitle}"` } },
          { title: "Event Starting Soon", message: { contains: `"${eventTitle}"` } },
        ],
      },
    });
    return { success: true };
  } catch (err) {
    console.error("deleteEventNotifications error:", err);
    return { success: false };
  }
}
