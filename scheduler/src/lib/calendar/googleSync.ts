/**
 * Google Calendar Sync
 *
 * All reads and writes between the local Prisma database and Google Calendar.
 * Covers background sync, force re-sync, event creation, deletion, and upsert logic.
 *
 * Google failures are logged but never propagated — local DB operations always
 * complete independently of the Google sync state.
 */

import { prisma } from "@/lib/prisma";
import { getGoogleCalendarClient } from "@/lib/calendar/googleCalendar";
import { buildGoogleRecurrenceRule } from "@/lib/calendar/eventHelpers";

/**
 * Parses a Google Calendar event's start/end into Date objects.
 * Falls back to midnight UTC for all-day events that use `date` instead of `dateTime`.
 *
 * @param ge - A raw Google Calendar event object.
 */
export function parseDts(ge: any): { startDt: Date; endDt: Date } {
  const startDt = ge.start?.dateTime
    ? new Date(ge.start.dateTime)
    : new Date((ge.start?.date ?? "") + "T00:00:00Z");
  const endDt = ge.end?.dateTime
    ? new Date(ge.end.dateTime)
    : new Date((ge.end?.date ?? "") + "T00:00:00Z");
  return { startDt, endDt };
}

/**
 * Builds the Prisma `where` filter for an upsert lookup.
 * When `matchByTitleDate` is true, also matches on title + start + end as a
 * fallback for events that may have been created locally before syncing.
 */
function buildUpsertWhere(ge: any, userId: string, matchByTitleDate: boolean, startDt: Date, endDt: Date) {
  if (matchByTitleDate) {
    return {
      userId,
      OR: [
        { googleEventId: ge.id },
        { title: ge.summary || "Untitled", start: startDt, end: endDt },
      ],
    };
  }
  return { googleEventId: ge.id, userId };
}

/**
 * Updates an existing local event from a Google Calendar event.
 * Skips the update if `matchByTitleDate` is true and the record was synced
 * within the last 10 seconds, to avoid overwriting in-flight local edits.
 */
async function updateGoogleEvent(existing: any, ge: any, startDt: Date, endDt: Date, matchByTitleDate: boolean): Promise<"updated" | "skipped"> {
  if (matchByTitleDate && existing.lastSyncedAt) {
    const diff = Date.now() - new Date(existing.lastSyncedAt).getTime();
    if (diff < 10000) return "skipped";
  }
  await prisma.event.update({
    where: { id: existing.id },
    data: {
      title: ge.summary || existing.title || "Untitled",
      description: ge.description || existing.description || "",
      start: startDt,
      end: endDt,
      allDay: !ge.start?.dateTime,
      lastSyncedAt: new Date(),
    },
  });
  return "updated";
}

/**
 * Creates a new local event record from a Google Calendar event.
 */
async function createGoogleEvent(ge: any, userId: string, startDt: Date, endDt: Date): Promise<"created"> {
  await prisma.event.create({
    data: {
      googleEventId: ge.id,
      userId,
      title: ge.summary || "Untitled",
      description: ge.description || "",
      start: startDt,
      end: endDt,
      category: "Google",
      allDay: !ge.start?.dateTime,
      lastSyncedAt: new Date(),
    },
  });
  return "created";
}

/**
 * Upserts a single Google Calendar event into the local database.
 * Skips cancelled events or those without an ID.
 *
 * @param ge - The raw Google Calendar event object.
 * @param userId - The owner of the event.
 * @param matchByTitleDate - When true, falls back to title+date matching for deduplication.
 * @returns `"created"`, `"updated"`, or `"skipped"`.
 */
export async function upsertGoogleEvent(
  ge: any,
  userId: string,
  matchByTitleDate = false,
): Promise<"created" | "updated" | "skipped"> {
  if (!ge.id || ge.status === "cancelled") return "skipped";

  const { startDt, endDt } = parseDts(ge);
  const where = buildUpsertWhere(ge, userId, matchByTitleDate, startDt, endDt);
  const existing = await prisma.event.findFirst({ where });

  if (existing) return updateGoogleEvent(existing, ge, startDt, endDt, matchByTitleDate);
  return createGoogleEvent(ge, userId, startDt, endDt);
}

/**
 * Pulls the last 30 days of events from Google Calendar and upserts them locally.
 * Called during GET when the sync interval has elapsed or no local events exist.
 *
 * @param userId - The user to sync.
 * @param now - Current timestamp in ms, used to compute the `timeMin` window.
 */
export async function syncGoogleCalendar(userId: string, now: number): Promise<void> {
  const calendar = await getGoogleCalendarClient(userId);
  if (!calendar) return;

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
    singleEvents: true,
  });

  for (const ge of res.data.items || []) {
    await upsertGoogleEvent(ge, userId, true).catch((err) =>
      console.error("Sync upsert error:", ge.id, err)
    );
  }
}

/**
 * Inserts a new event into Google Calendar and returns the resulting event ID.
 * Returns `null` silently if the user has no linked Google account.
 *
 * @param userId - The user whose calendar to insert into.
 * @param body - Event fields including title, start/end, allDay flag, and recurrence.
 */
export async function insertGoogleEvent(
  userId: string,
  body: {
    title: string;
    description?: string;
    start: string;
    end: string;
    allDay?: boolean;
    recurrenceData: any;
  },
): Promise<string | null> {
  try {
    const calendar = await getGoogleCalendarClient(userId);
    if (!calendar) return null;

    const { title, description, start, end, allDay, recurrenceData } = body;
    const gRes = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: title,
        description: description || "",
        start: allDay
          ? { date: new Date(start).toISOString().split("T")[0] }
          : { dateTime: new Date(start).toISOString(), timeZone: "UTC" },
        end: allDay
          ? { date: new Date(end).toISOString().split("T")[0] }
          : { dateTime: new Date(end).toISOString(), timeZone: "UTC" },
        recurrence: buildGoogleRecurrenceRule(recurrenceData),
      },
    });
    return gRes.data.id || null;
  } catch (err) {
    console.error("Google Calendar Insert Failed:", err);
    return null;
  }
}

/**
 * Persists a new event to the local database after Google Calendar insertion.
 * Strips sub-second precision from start/end to keep timestamps consistent with sync.
 *
 * @param userId - The owner of the event.
 * @param googleEventId - The ID returned by Google, or `null` if insertion was skipped.
 * @param body - Full event fields including location, travel, and recurrence data.
 */
export async function createLocalEvent(
  userId: string,
  googleEventId: string | null,
  body: {
    title: string; description?: string;
    start: string; end: string;
    allDay?: boolean; category?: string;
    recurrenceData: any;
    startCoords?: any; destCoords?: any;
    travelDuration?: number | null;
    startLocationName?: string; destLocationName?: string;
    transportMode?: string;
  },
) {
  const cleanStart = new Date(new Date(body.start).toISOString().split(".")[0] + "Z");
  const cleanEnd = new Date(new Date(body.end).toISOString().split(".")[0] + "Z");

  return prisma.event.create({
    data: {
      title: body.title, description: body.description || "",
      start: cleanStart, end: cleanEnd,
      allDay: Boolean(body.allDay), category: body.category || "Personal",
      userId, recurrence: body.recurrenceData ?? null,
      googleEventId: googleEventId || null,
      startCoords: body.startCoords ?? null,
      destinationCoords: body.destCoords ?? null,
      travelDuration: body.travelDuration ? Math.round(body.travelDuration) : null,
      startLocationName: body.startLocationName || null,
      destLocationName: body.destLocationName || null,
      transportMode: body.transportMode || null,
    },
  });
}

/**
 * Fetches up to 2500 events spanning +/- 1 year from Google Calendar.
 * Used by the force re-sync (PUT) endpoint. Returns `null` if no Google account is linked.
 *
 * @param userId - The user whose calendar to fetch.
 */
export async function fetchAllGoogleEvents(userId: string) {
  const { getGoogleCalendarClient } = await import("@/lib/calendar/googleCalendar");
  const calendar = await getGoogleCalendarClient(userId);
  if (!calendar) return null;

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    timeMax: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    singleEvents: false,
    maxResults: 2500,
  });

  return res.data.items || [];
}

/**
 * Adds an occurrence date to a recurring event's `exceptions` list and removes
 * it from Google Calendar. Returns `{ error }` if the date is invalid, `null` on success.
 *
 * @param userId - The event owner.
 * @param eventId - The local Prisma event ID.
 * @param googleEventId - The Google event ID, or `null` if not synced.
 * @param exceptions - The existing exceptions array to check for duplicates.
 * @param instanceDate - ISO date string of the occurrence to delete.
 */
export async function deleteSingleOccurrence(
  userId: string,
  eventId: string,
  googleEventId: string | null,
  exceptions: string[],
  instanceDate: string,
): Promise<{ error: string } | null> {
  const dt = new Date(instanceDate);
  if (isNaN(dt.getTime())) return { error: "Invalid date" };

  const iso = dt.toISOString().split(".")[0] + "Z";
  if (googleEventId) await deleteGoogleEvent(userId, googleEventId, iso);
  if (!exceptions.includes(iso))
    await prisma.event.update({ where: { id: eventId }, data: { exceptions: { push: iso } } });

  return null;
}

/**
 * Deletes an event or a single occurrence from Google Calendar.
 * When `instanceIso` is provided, constructs the instance ID and deletes only that occurrence.
 * Errors are swallowed so a Google failure never blocks a local delete.
 *
 * @param userId - The event owner.
 * @param googleEventId - The master Google event ID.
 * @param instanceIso - Optional ISO timestamp identifying a specific occurrence to delete.
 */
export async function deleteGoogleEvent(
  userId: string,
  googleEventId: string,
  instanceIso?: string,
): Promise<void> {
  try {
    const calendar = await getGoogleCalendarClient(userId);
    if (!calendar) return;

    const eventId = instanceIso
      ? `${googleEventId}_${instanceIso.replace(/[-:]/g, "").split("T")[0]}Z`
      : googleEventId;

    await calendar.events.delete({ calendarId: "primary", eventId });
  } catch (err) {
    console.error("Google Calendar Delete Failed:", err);
  }
}