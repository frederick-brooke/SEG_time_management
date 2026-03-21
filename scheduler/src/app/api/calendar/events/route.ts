/**
 * Calendar Events API route — handles CRUD for calendar events.
 * Covers Google Calendar sync, recurring event expansion, and travel time calculation.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ObjectId } from "mongodb";
import { calculateTravelTime } from "@/src/lib/travel";
import { expandRecurringEvents } from "@/src/lib/calendar/eventHelpers";
import { handleSingleInstanceUpdate, handleSeriesUpdate } from "@/src/lib/calendar/eventMutations";
import {
  syncGoogleCalendar,
  insertGoogleEvent,
  createLocalEvent,
  deleteGoogleEvent,
  deleteSingleOccurrence,
  upsertGoogleEvent,
  fetchAllGoogleEvents,
} from "@/src/lib/calendar/googleSync";

// Global lock to prevent multiple syncs running at once per server instance
let isSyncing = false;
let lastSyncTime = 0;
const SYNC_INTERVAL = 5 * 60 * 1000;

/**
* Extracts and validates DELETE query params from the request URL.
* @returns Parsed `{ id, mode, instanceDate }` or `{ error: NextResponse }` if the ID is invalid.
*/
function parseDeleteParams(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const mode = searchParams.get("mode");
  const instanceDate = searchParams.get("date");
  if (!id || !ObjectId.isValid(id))
    return { error: NextResponse.json({ message: "Invalid event ID. Must be a MongoDB ObjectID" }, { status: 400 }) };
  return { id, mode, instanceDate };
}

/**
 * Builds a Prisma where-filter for GET event queries.
 * Supports optional full-text search via `q` and category filtering.
 */
function buildEventFilters(userId: string, searchParams: URLSearchParams) {
  const filters: any = { userId };
  const query = searchParams.get("q");
  const category = searchParams.get("category");
  if (query)
    filters.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  if (category && category !== "all") filters.category = category;
  return filters;
}

/**
 * GET /api/calendar/events
 * Returns expanded events for the user. Triggers a Google sync when the
 * interval has elapsed, no local events exist, or `force=true` is passed.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const now = Date.now();
  const { searchParams } = new URL(req.url);
  const localCount = await prisma.event.count({ where: { userId: session.user.id } });
  // Sync if forced, or the cooldown has elapsed, or the user has no local events yet.
  const shouldSync =
    searchParams.get("force") === "true" || now - lastSyncTime > SYNC_INTERVAL || localCount === 0;

  if (!isSyncing && shouldSync) {
    isSyncing = true;
    lastSyncTime = now;
    try {
      await syncGoogleCalendar(session.user.id, now);
    } finally {
      isSyncing = false;
    }
  }

  const filters = buildEventFilters(session.user.id, searchParams);
  const events = await prisma.event.findMany({ where: filters, orderBy: { start: "asc" } });
  return NextResponse.json(expandRecurringEvents(events));
}

/**
 * POST /api/calendar/events
 * Creates an event locally and pushes it to Google Calendar.
 * Auto-calculates travel time when coordinates are provided without a duration.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const {
    title, description, start, end, allDay, category,
    recurrenceType, recurrenceDays, recurrenceUntil,
    startCoords, destCoords, startLocationName, destLocationName,
    transportMode, travelDuration: clientTravelDuration,
  } = await req.json();

  let travelDuration = clientTravelDuration;
  if ((travelDuration === undefined || travelDuration === null) && startCoords && destCoords)
    travelDuration = await calculateTravelTime(startCoords, destCoords, transportMode);

  const recurrenceData = recurrenceType && recurrenceType !== "none"
    ? { type: recurrenceType, until: recurrenceUntil ? new Date(recurrenceUntil) : null, days: recurrenceDays }
    : null;
  try {
    const googleEventId = await insertGoogleEvent(session.user.id, {
      title, description, start, end, allDay, recurrenceData,
    });
    const event = await createLocalEvent(session.user.id, googleEventId, {
      title, description, start, end, allDay, category, recurrenceData,
      startCoords, destCoords, travelDuration, startLocationName, destLocationName, transportMode,
    });
    return NextResponse.json(event, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}

/**
 * PUT /api/calendar/events
 * Forces a full re-sync of Google Calendar events into the local database.
 * @returns `{ created, updated, skipped, total }` summary.
 */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  try {
    const googleEvents = await fetchAllGoogleEvents(session.user.id);
    if (!googleEvents)
      return NextResponse.json({ message: "No Google Calendar linked" }, { status: 400 });

    let created = 0, updated = 0, skipped = 0;
    for (const ge of googleEvents) {
      const outcome = await upsertGoogleEvent(ge, session.user.id);
      if (outcome === "created") created++;
      else if (outcome === "updated") updated++;
      else skipped++;
    }

    return NextResponse.json({ message: "Re-sync complete", created, updated, skipped, total: googleEvents.length });
  } catch (err: any) {
    console.error("Force re-sync failed:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/calendar/events
 * Updates an event. When `mode === "single"` and `originalDate` is set,
 * creates an exception for that occurrence only. Otherwise updates the series.
 */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { id, mode, originalDate, startCoords, destCoords, transportMode, travelDuration: clientTravelDuration } = body;

    const event = await prisma.event.findFirst({ where: { id, userId: session.user.id } });
    if (!event)
      return NextResponse.json({ message: "Not found" }, { status: 404 });

    let travelDuration = clientTravelDuration;
    if ((travelDuration === undefined || travelDuration === null) && startCoords && destCoords)
      travelDuration = await calculateTravelTime(startCoords, destCoords, transportMode);

    const enrichedBody = { ...body, travelDuration };
    const result =
      mode === "single" && originalDate
        ? await handleSingleInstanceUpdate(event, enrichedBody, session.user.id)
        : await handleSeriesUpdate(event, enrichedBody, session.user.id);

    return NextResponse.json(result);
  } catch (e: any) {
    console.error("PATCH error:", e);
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}

/**
 * DELETE /api/calendar/events
 * Removes an event. When `mode=single` and `date` are provided, removes only
 * that occurrence. Otherwise deletes the entire event from Google and the DB.
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const params = parseDeleteParams(req);
  if ("error" in params) return params.error;
  const { id, mode, instanceDate } = params;
  try {
    const event = await prisma.event.findFirst({ where: { id, userId: session.user.id } });
    if (!event)
      return NextResponse.json({ message: "Event not found" }, { status: 404 });

    if (mode === "single" && instanceDate) {
      const err = await deleteSingleOccurrence(
        session.user.id, id, event.googleEventId, event.exceptions || [], instanceDate,
      );
      if (err) return NextResponse.json({ message: err.error }, { status: 400 });
      return NextResponse.json({ success: true, message: "Occurrence removed" });
    }

    if (event.googleEventId) await deleteGoogleEvent(session.user.id, event.googleEventId);
    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Event deleted" });
  } catch (e: any) {
    console.error("Delete handler error:", e);
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}