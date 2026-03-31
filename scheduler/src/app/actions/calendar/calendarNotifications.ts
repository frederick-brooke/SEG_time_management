"use server";

/**
 * Sends travel and upcoming event notifications.
 * Prevents duplicates and provides helpers to reset or delete them.
 */

import { prisma } from "lib/prisma";
import { createNotification } from "../notifications";
import { NotificationType } from "@prisma/client";
import type { Event as PrismaEvent } from "@prisma/client";

const LOOK_AHEAD_MS = 60 * 60 * 1000; // 1 hour
const EVENT_REMINDER_MINS = 5;

/**
 * Formats a duration in minutes into a human-readable string.
 * @param minutes - Duration in minutes.
 * @returns A string like "45 min", "2h", or "1h 30m".
 */
function formatTravelDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Formats a Date into a localised HH:MM time string.
 * @param date - The date to format.
 * @returns A string like "09:30" or "2:45 PM" depending on locale.
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Evaluates and fires travel and event reminder notifications for a single event.
 * - Sends a "Time to Leave" warning when the travel window has been reached and not yet notified.
 * - Sends an "Event Starting Soon" reminder within 5 minutes of the event start.
 *
 * @param userId - The authenticated user's ID.
 * @param event - The Prisma event record to evaluate.
 * @param now - The current timestamp, shared across all events in a single check run.
 */
async function processEventNotifications(userId: string, event: PrismaEvent, now: Date) {
  const minsUntilEvent = (new Date(event.start).getTime() - now.getTime()) / 60_000;

  if (typeof event.travelDuration === "number" && event.travelDuration > 0 && minsUntilEvent <= event.travelDuration && !event.travelNotifiedAt) {
    const eventStart = new Date(event.start);
    const leaveTime = formatTime(new Date(eventStart.getTime() - event.travelDuration * 60_000));
    const destination = event.destLocationName || event.title;
    await createNotification(userId, "Time to Leave", `You need to leave now for "${event.title}". Journey to ${destination} takes ${formatTravelDuration(event.travelDuration)} — leave by ${leaveTime}.`, NotificationType.WARNING);
    await prisma.event.update({ where: { id: event.id }, data: { travelNotifiedAt: now } });
  }

  if (minsUntilEvent <= EVENT_REMINDER_MINS && minsUntilEvent > 0 && !event.eventNotifiedAt) {
    const mins = Math.round(minsUntilEvent);
    await createNotification(userId, "Event Starting Soon", `"${event.title}" starts in ${mins} minute${mins === 1 ? "" : "s"} at ${formatTime(new Date(event.start))}.`, NotificationType.INFO);
    await prisma.event.update({ where: { id: event.id }, data: { eventNotifiedAt: now } });
  }
}

/**
 * Checks all upcoming events for a user and fires any due notifications.
 * Queries events within a 1-hour look-ahead window and processes each in parallel.
 *
 * @param userId - The authenticated user's ID.
 * @returns `{ success: true }` on success, or `{ success: false, error }` on failure.
 */
export async function checkUpcomingEventNotifications(userId: string) {
  if (!userId) return { success: false, error: "No userId" };
  try {
    const now = new Date();
    const upcomingEvents = await prisma.event.findMany({
      where: {
        userId,
        allDay: false,
        start: {
          gte: new Date(now.getTime() - LOOK_AHEAD_MS),
          lte: new Date(now.getTime() + LOOK_AHEAD_MS),
        },
      },
    });

    await Promise.all(upcomingEvents.map((event) => processEventNotifications(userId, event, now)));
    return { success: true };
  } catch (err) {
    console.error("checkUpcomingEventNotifications error:", err);
    return { success: false, error: "Failed to check event notifications" };
  }
}

/**
 * Resets the notification guard flags on an event, allowing notifications to fire again.
 * Useful after an event is rescheduled or updated.
 *
 * @param eventId - The ID of the event to reset.
 * @returns `{ success: true }` on success, or `{ success: false }` on failure.
 */
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

/**
 * Deletes any unread travel or reminder notifications for a given event title.
 * Called when an event is deleted to prevent stale notifications from appearing.
 *
 * @param userId - The authenticated user's ID.
 * @param eventTitle - The title of the event whose notifications should be removed.
 * @returns `{ success: true }` on success, or `{ success: false }` on failure.
 */
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
