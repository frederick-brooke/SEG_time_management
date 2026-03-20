import { prisma } from "@/lib/prisma";
import { getGoogleCalendarClient } from "@/src/lib/googleCalendar";
import { buildGoogleRecurrenceRule } from "@/src/lib/eventHelpers";

// ---------------------------------------------------------------------------
// parseDts
// Converts a Google Calendar event's start/end into Date objects.
// ---------------------------------------------------------------------------
export function parseDts(ge: any): { startDt: Date; endDt: Date } {
  const startDt = ge.start?.dateTime
    ? new Date(ge.start.dateTime)
    : new Date((ge.start?.date ?? "") + "T00:00:00Z");
  const endDt = ge.end?.dateTime
    ? new Date(ge.end.dateTime)
    : new Date((ge.end?.date ?? "") + "T00:00:00Z");
  return { startDt, endDt };
}

// ---------------------------------------------------------------------------
// upsertGoogleEvent helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// upsertGoogleEvent
// Upserts a single Google Calendar event into the local Prisma database.
// Used by both the background sync (GET) and the force re-sync (PUT).
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// syncGoogleCalendar
// Pulls the last 30 days of events from Google and upserts them locally.
// Called during GET when a sync is due.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// insertGoogleEvent
// Pushes a new event to Google Calendar and returns the resulting event ID.
// Returns null silently if the user has no Google Calendar linked.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// createLocalEvent
// Persists a new event to the local database after Google Calendar insertion.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// fetchAllGoogleEvents
// Fetches a full year of events from Google Calendar for force re-sync (PUT).
// ---------------------------------------------------------------------------
export async function fetchAllGoogleEvents(userId: string) {
  const { getGoogleCalendarClient } = await import("@/src/lib/googleCalendar");
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

// ---------------------------------------------------------------------------
// deleteSingleOccurrence
// Adds a date exception to a recurring event and removes it from Google.
// Returns a 400 response string if the date is invalid, null on success.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// deleteGoogleEvent
// Deletes either a single recurring instance or an entire event from Google.
// Swallows errors so a Google failure never blocks the local delete.
// ---------------------------------------------------------------------------
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