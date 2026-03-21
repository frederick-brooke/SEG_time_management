/**
 * Event Mutations
 *
 * Handles updates and deletions for both single occurrences and full recurring
 * series, keeping the local Prisma database and Google Calendar in sync.
 */

import { prisma } from "@/lib/prisma";
import { getGoogleCalendarClient } from "@/src/lib/calendar/googleCalendar";
import { resetEventNotificationGuards } from "@/src/app/actions/calendarNotifications";

/**
 * Patches a single occurrence of a Google Calendar recurring event by constructing
 * the instance ID from the master event ID and the exception's ISO timestamp.
 *
 * @param event - The local master event record containing `googleEventId`.
 * @param isoException - ISO 8601 timestamp of the occurrence to patch.
 * @param body - The update payload containing `title`, `description`, `start`, and `end`.
 * @param userId - The ID of the user whose Google Calendar client to use.
 * @returns The Google event ID of the patched instance, or `null` if the patch failed or was skipped.
 */
async function patchGoogleInstance(
  event: any,
  isoException: string,
  body: any,
  userId: string,
): Promise<string | null> {
  if (!event.googleEventId) return null;
  try {
    const calendar = await getGoogleCalendarClient(userId);
    if (!calendar) return null;
    const instanceId = `${event.googleEventId}_${isoException.replace(/[-:]/g, "").split(".")[0]}Z`;
    const gRes = await calendar.events.patch({
      calendarId: "primary",
      eventId: instanceId,
      requestBody: {
        summary: body.title || event.title,
        description: body.description || event.description,
        start: { dateTime: new Date(body.start).toISOString() },
        end: { dateTime: new Date(body.end).toISOString() },
      },
    });
    return gRes.data.id || null;
  } catch (err) {
    console.error("Google Instance Update Failed:", err);
    return null;
  }
}

/**
 * Creates a new local event record representing a single exception to a recurring series.
 * Falls back to the master event's fields for any properties not supplied in `body`.
 *
 * @param event - The master event record to inherit default values from.
 * @param body - The override values for the exception (title, start, end, location, etc.).
 * @param userId - The ID of the user who owns the event.
 * @param googleEventId - The Google event ID for the patched instance, or `null` if unavailable.
 * @returns The newly created Prisma event record.
 */
async function createExceptionEvent(event: any, body: any, userId: string, googleEventId: string | null) {
  const { start, end, title, description, startCoords, destCoords, startLocationName, destLocationName, transportMode, travelDuration } = body;
  return prisma.event.create({
    data: {
      title: title || event.title,
      description: description || event.description,
      start: new Date(start),
      end: new Date(end),
      userId,
      category: event.category,
      googleEventId,
      allDay: event.allDay,
      startCoords: startCoords ?? event.startCoords,
      destinationCoords: destCoords ?? event.destinationCoords,
      travelDuration: travelDuration ? Math.round(travelDuration) : event.travelDuration,
      transportMode: transportMode || event.transportMode,
      startLocationName: startLocationName || event.startLocationName,
      destLocationName: destLocationName || event.destLocationName,
    },
  });
}

/**
 * Computes the updated start and end times for a recurring series edit.
 * Preserves the master event's original date while applying the new time-of-day
 * and duration from `body`.
 *
 * @param event - The master event record, used for its original `start` date and `allDay` flag.
 * @param body - The update payload containing the new `start` and `end` values.
 * @returns The resolved `updatedSeriesStart` and `updatedSeriesEnd` dates.
 */
function calcSeriesTimes(event: any, body: any): { updatedSeriesStart: Date; updatedSeriesEnd: Date } {
  const newDateReq = new Date(body.start);
  const newEndDateReq = new Date(body.end);
  const originalMasterStart = new Date(event.start);
  
  // Calculate the duration in milliseconds
  const duration = newEndDateReq.getTime() - newDateReq.getTime();
  const updatedSeriesStart = new Date(originalMasterStart);
  updatedSeriesStart.setHours(newDateReq.getHours(), newDateReq.getMinutes(), 0, 0);
  const updatedSeriesEnd = new Date(updatedSeriesStart.getTime() + duration);
  
  return { updatedSeriesStart, updatedSeriesEnd };
}

/**
 * Fires a Google Calendar patch for the master recurring event asynchronously.
 * Automatically selects `date` vs `dateTime` format based on whether the event is all-day.
 * Errors are logged but do not propagate to the caller.
 *
 * @param updated - The already-saved local event record containing `googleEventId`, `title`, etc.
 * @param updatedSeriesStart - The new start time to send to Google.
 * @param updatedSeriesEnd - The new end time to send to Google.
 * @param userId - The ID of the user whose Google Calendar client to use.
 */
function patchGoogleSeries(
  updated: any,
  updatedSeriesStart: Date,
  updatedSeriesEnd: Date,
  userId: string,
): void {
  if (!updated.googleEventId) return;
  (async () => {
    try {
      const calendar = await getGoogleCalendarClient(userId);
      if (!calendar) return;
      
      const isAllDay = updated.allDay || 
        (updatedSeriesStart.getHours() === 0 && updatedSeriesStart.getMinutes() === 0 &&
         updatedSeriesEnd.getHours() === 0 && updatedSeriesEnd.getMinutes() === 0);
      
      const start = isAllDay 
        ? { date: updatedSeriesStart.toISOString().split('T')[0], timeZone: "UTC" }
        : { dateTime: updatedSeriesStart.toISOString(), timeZone: "UTC" };
      
      const end = isAllDay 
        ? { date: updatedSeriesEnd.toISOString().split('T')[0], timeZone: "UTC" }
        : { dateTime: updatedSeriesEnd.toISOString(), timeZone: "UTC" };
      
      await calendar.events.patch({
        calendarId: "primary",
        eventId: updated.googleEventId!,
        requestBody: { summary: updated.title, description: updated.description || "", start, end },
      });
    } catch (err) {
      console.error("Google Series Update Failed:", err);
    }
  })();
}

/**
 * Updates a single occurrence of a recurring event without affecting the rest of the series.
 * Adds the occurrence date to the master event's `exceptions` list, patches it in Google
 * Calendar, then creates a standalone local event record for the exception.
 *
 * @param event - The master recurring event record.
 * @param body - The update payload, must include `originalDate` to identify the occurrence.
 * @param userId - The ID of the user performing the update.
 * @returns The newly created exception event record.
 */
export async function handleSingleInstanceUpdate(event: any, body: any, userId: string) {
  const isoException = new Date(body.originalDate).toISOString();

  await prisma.event.update({
    where: { id: event.id },
    data: { exceptions: { push: isoException } },
  });

  const googleEventId = await patchGoogleInstance(event, isoException, body, userId);
  return createExceptionEvent(event, body, userId, googleEventId);
}

/**
 * Updates the master recurring event, applying changes to all future occurrences.
 * Preserves the original recurrence start date while updating time, duration, and
 * location fields. Also patches the event in Google Calendar asynchronously.
 *
 * @param event - The current master event record from the database.
 * @param body - The update payload (title, description, start, end, location, travel, etc.).
 * @param userId - The ID of the user performing the update.
 * @returns The updated master event record.
 */
export async function handleSeriesUpdate(event: any, body: any, userId: string) {
  const { id, startCoords, destCoords, startLocationName, destLocationName, transportMode, travelDuration, title, description } = body;
  const { updatedSeriesStart, updatedSeriesEnd } = calcSeriesTimes(event, body);

  const updated = await prisma.event.update({
    where: { id },
    data: {
      title: title || undefined,
      description: description || undefined,
      start: updatedSeriesStart,
      end: updatedSeriesEnd,
      startCoords: startCoords ?? null,
      destinationCoords: destCoords ?? null,
      travelDuration: travelDuration ? Math.round(travelDuration) : null,
      startLocationName: startLocationName ?? null,
      destLocationName: destLocationName ?? null,
      transportMode,
      travelNotifiedAt: null,
      eventNotifiedAt:null,
    },
  });

  patchGoogleSeries(updated, updatedSeriesStart, updatedSeriesEnd, userId);
  return updated;
}