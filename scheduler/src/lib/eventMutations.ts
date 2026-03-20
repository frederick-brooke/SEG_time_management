// src/lib/eventMutations.ts
import { prisma } from "@/lib/prisma";
import { getGoogleCalendarClient } from "@/src/lib/googleCalendar";

// ---------------------------------------------------------------------------
// handleSingleInstanceUpdate helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// handleSeriesUpdate helpers
// ---------------------------------------------------------------------------

function calcSeriesTimes(event: any, body: any): { updatedSeriesStart: Date; updatedSeriesEnd: Date } {
  const newDateReq = new Date(body.start);
  const newEndDateReq = new Date(body.end);
  const originalMasterStart = new Date(event.start);
  const updatedSeriesStart = new Date(originalMasterStart);
  updatedSeriesStart.setHours(newDateReq.getHours(), newDateReq.getMinutes(), 0, 0);
  const duration = newEndDateReq.getTime() - newDateReq.getTime();
  const updatedSeriesEnd = new Date(updatedSeriesStart.getTime() + duration);
  return { updatedSeriesStart, updatedSeriesEnd };
}

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

// ---------------------------------------------------------------------------
// handleSingleInstanceUpdate
// Creates a standalone exception event for one occurrence of a recurring series.
// ---------------------------------------------------------------------------
export async function handleSingleInstanceUpdate(event: any, body: any, userId: string) {
  const isoException = new Date(body.originalDate).toISOString();

  await prisma.event.update({
    where: { id: event.id },
    data: { exceptions: { push: isoException } },
  });

  const googleEventId = await patchGoogleInstance(event, isoException, body, userId);
  return createExceptionEvent(event, body, userId, googleEventId);
}

// ---------------------------------------------------------------------------
// handleSeriesUpdate
// Updates the master recurring event, preserving the original date but
// applying the new time-of-day and duration.
// ---------------------------------------------------------------------------
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
    },
  });

  patchGoogleSeries(updated, updatedSeriesStart, updatedSeriesEnd, userId);
  return updated;
}