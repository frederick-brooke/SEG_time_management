// src/lib/eventMutations.ts
import { prisma } from "@/lib/prisma";
import { getGoogleCalendarClient } from "@/src/lib/googleCalendar";

// ---------------------------------------------------------------------------
// handleSingleInstanceUpdate
// Creates a standalone exception event for one occurrence of a recurring series.
// ---------------------------------------------------------------------------
export async function handleSingleInstanceUpdate(
  event: any,
  body: any,
  userId: string,
) {
  const {
    start, end, title, description,
    startCoords, destCoords, startLocationName, destLocationName,
    transportMode, travelDuration,
  } = body;

  const isoException = new Date(body.originalDate).toISOString();

  // Add this date as an exception on the master event
  await prisma.event.update({
    where: { id: event.id },
    data: { exceptions: { push: isoException } },
  });

  // Patch the specific Google Calendar instance if one exists
  let googleEventIdForNewEvent: string | null = null;
  if (event.googleEventId) {
    try {
      const calendar = await getGoogleCalendarClient(userId);
      if (calendar) {
        const instanceId = `${event.googleEventId}_${isoException.replace(/[-:]/g, "").split(".")[0]}Z`;
        const gRes = await calendar.events.patch({
          calendarId: "primary",
          eventId: instanceId,
          requestBody: {
            summary: title || event.title,
            description: description || event.description,
            start: { dateTime: new Date(start).toISOString() },
            end: { dateTime: new Date(end).toISOString() },
          },
        });
        googleEventIdForNewEvent = gRes.data.id || null;
      }
    } catch (err) {
      console.error("Google Instance Update Failed:", err);
    }
  }

  // Create a standalone event for this exception occurrence
  return prisma.event.create({
    data: {
      title: title || event.title,
      description: description || event.description,
      start: new Date(start),
      end: new Date(end),
      userId,
      category: event.category,
      googleEventId: googleEventIdForNewEvent,
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

// ---------------------------------------------------------------------------
// handleSeriesUpdate
// Updates the master recurring event, preserving the original date but
// applying the new time-of-day and duration.
// ---------------------------------------------------------------------------
export async function handleSeriesUpdate(
  event: any,
  body: any,
  userId: string,
) {
  const {
    id, start, end, title, description,
    startCoords, destCoords, startLocationName, destLocationName,
    transportMode, travelDuration,
  } = body;

  const newDateReq = new Date(start);
  const newEndDateReq = new Date(end);
  const originalMasterStart = new Date(event.start);

  // Keep the original calendar date, but apply the new time-of-day
  const updatedSeriesStart = new Date(originalMasterStart);
  updatedSeriesStart.setHours(newDateReq.getHours(), newDateReq.getMinutes(), 0, 0);

  const duration = newEndDateReq.getTime() - newDateReq.getTime();
  const updatedSeriesEnd = new Date(updatedSeriesStart.getTime() + duration);

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
    },
  });

  // Patch Google Calendar asynchronously — don't block the response
  if (updated.googleEventId) {
    (async () => {
      try {
        const calendar = await getGoogleCalendarClient(userId);
        if (calendar) {
          await calendar.events.patch({
            calendarId: "primary",
            eventId: updated.googleEventId!,
            requestBody: {
              summary: updated.title,
              description: updated.description || "",
              start: { dateTime: updatedSeriesStart.toISOString(), timeZone: "UTC" },
              end: { dateTime: updatedSeriesEnd.toISOString(), timeZone: "UTC" },
            },
          });
        }
      } catch (err) {
        console.error("Google Series Update Failed:", err);
      }
    })();
  }

  return updated;
}