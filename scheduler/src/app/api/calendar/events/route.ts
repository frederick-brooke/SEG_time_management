import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGoogleCalendarClient } from "@/src/lib/googleCalendar";
import { ObjectId } from "mongodb";
import { calculateTravelTime } from "@/src/lib/travel";
import { expandRecurringEvents, buildGoogleRecurrenceRule } from "@/src/lib/eventHelpers";
import { handleSingleInstanceUpdate, handleSeriesUpdate } from "@/src/lib/eventMutations";

// Global lock to prevent multiple syncs running at once per server instance
let isSyncing = false;
let lastSyncTime = 0;
const SYNC_INTERVAL = 5 * 60 * 1000;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const now = Date.now();
  const { searchParams } = new URL(req.url);

  const localCount = await prisma.event.count({
    where: { userId: session.user.id },
  });

  const shouldSync =
    searchParams.get("force") === "true" ||
    now - lastSyncTime > SYNC_INTERVAL ||
    localCount === 0;

  if (!isSyncing && shouldSync) {
    isSyncing = true;
    lastSyncTime = now;

    try {
      const calendar = await getGoogleCalendarClient(session.user.id);
      if (calendar) {
        const res = await calendar.events.list({
          calendarId: "primary",
          timeMin: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
          singleEvents: true,
        });

        for (const ge of res.data.items || []) {
          if (!ge.id || ge.status === "cancelled") continue;

          const startDt = ge.start?.dateTime
            ? new Date(ge.start.dateTime)
            : new Date((ge.start?.date ?? "") + "T00:00:00Z");
          const endDt = ge.end?.dateTime
            ? new Date(ge.end.dateTime)
            : new Date((ge.end?.date ?? "") + "T00:00:00Z");

          const localEvent = await prisma.event.findFirst({
            where: {
              userId: session.user.id,
              OR: [
                { googleEventId: ge.id },
                { title: ge.summary || "Untitled", start: startDt, end: endDt },
              ],
            },
          });

          if (localEvent?.lastSyncedAt) {
            const diff = Date.now() - new Date(localEvent.lastSyncedAt).getTime();
            if (diff < 10000) continue;
          }

          if (localEvent) {
            await prisma.event
              .update({
                where: { id: localEvent.id },
                data: {
                  title: ge.summary || localEvent.title || "Untitled",
                  description: ge.description || localEvent.description || "",
                  start: startDt,
                  end: endDt,
                  allDay: !ge.start?.dateTime,
                  lastSyncedAt: new Date(),
                },
              })
              .catch((err) => console.error("Sync Update Error:", err));
          } else {
            await prisma.event
              .create({
                data: {
                  googleEventId: ge.id,
                  userId: session.user.id,
                  title: ge.summary || "Untitled",
                  description: ge.description || "",
                  start: startDt,
                  end: endDt,
                  category: "Google",
                  allDay: !ge.start?.dateTime,
                  lastSyncedAt: new Date(),
                },
              })
              .catch((err) => console.error("Sync Create Error:", err));
          }
        }
      }
    } finally {
      isSyncing = false;
    }
  }

  const query = searchParams.get("q");
  const category = searchParams.get("category");
  const filters: any = { userId: session.user.id };
  if (query) {
    filters.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }
  if (category && category !== "all") filters.category = category;

  const events = await prisma.event.findMany({
    where: filters,
    orderBy: { start: "asc" },
  });

  return NextResponse.json(expandRecurringEvents(events));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    title, description, start, end, allDay, category,
    recurrenceType, recurrenceDays, recurrenceUntil,
    startCoords, destCoords, startLocationName, destLocationName,
    transportMode, travelDuration: clientTravelDuration,
  } = body;

  let travelDuration = clientTravelDuration;
  if ((travelDuration === undefined || travelDuration === null) && startCoords && destCoords) {
    travelDuration = await calculateTravelTime(startCoords, destCoords, transportMode);
  }

  const recurrenceData =
    recurrenceType && recurrenceType !== "none"
      ? { type: recurrenceType, until: recurrenceUntil ? new Date(recurrenceUntil) : null, days: recurrenceDays }
      : null;

  try {
    let googleEventId: string | null = null;
    try {
      const calendar = await getGoogleCalendarClient(session.user.id);
      if (calendar) {
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
        googleEventId = gRes.data.id || null;
      }
    } catch (googleError) {
      console.error("Google Calendar Insert Failed:", googleError);
    }

    const cleanStart = new Date(new Date(start).toISOString().split(".")[0] + "Z");
    const cleanEnd = new Date(new Date(end).toISOString().split(".")[0] + "Z");

    const event = await prisma.event.create({
      data: {
        title, description: description || "",
        start: cleanStart, end: cleanEnd,
        allDay: Boolean(allDay),
        category: category || "Personal",
        userId: session.user.id,
        recurrence: recurrenceData ?? null,
        googleEventId: googleEventId || null,
        startCoords: startCoords ?? null,
        destinationCoords: destCoords ?? null,
        travelDuration: travelDuration ? Math.round(travelDuration) : null,
        startLocationName: startLocationName || null,
        destLocationName: destLocationName || null,
        transportMode: transportMode || null,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  try {
    const calendar = await getGoogleCalendarClient(session.user.id);
    if (!calendar)
      return NextResponse.json({ message: "No Google Calendar linked" }, { status: 400 });

    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      timeMax: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      singleEvents: false,
      maxResults: 2500,
    });

    const googleEvents = res.data.items || [];
    let created = 0, updated = 0, skipped = 0;

    for (const ge of googleEvents) {
      if (!ge.id || ge.status === "cancelled") { skipped++; continue; }

      const startDt = ge.start?.dateTime
        ? new Date(ge.start.dateTime)
        : new Date((ge.start?.date ?? "") + "T00:00:00Z");
      const endDt = ge.end?.dateTime
        ? new Date(ge.end.dateTime)
        : new Date((ge.end?.date ?? "") + "T00:00:00Z");

      const existing = await prisma.event.findFirst({
        where: { googleEventId: ge.id, userId: session.user.id },
      });

      if (existing) {
        await prisma.event.update({
          where: { id: existing.id },
          data: { title: ge.summary || "Untitled", start: startDt, end: endDt, description: ge.description || "", lastSyncedAt: new Date() },
        });
        updated++;
      } else {
        await prisma.event.create({
          data: {
            googleEventId: ge.id,
            title: ge.summary || "Untitled",
            description: ge.description || "",
            start: startDt, end: endDt,
            userId: session.user.id,
            category: "Google",
            allDay: !ge.start?.dateTime,
            lastSyncedAt: new Date(),
          },
        });
        created++;
      }
    }

    return NextResponse.json({ message: "Re-sync complete", created, updated, skipped, total: googleEvents.length });
  } catch (err: any) {
    console.error("Force re-sync failed:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

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
    if ((travelDuration === undefined || travelDuration === null) && startCoords && destCoords) {
      travelDuration = await calculateTravelTime(startCoords, destCoords, transportMode);
    }

    const enrichedBody = { ...body, travelDuration };

    if (mode === "single" && originalDate) {
      const result = await handleSingleInstanceUpdate(event, enrichedBody, session.user.id);
      return NextResponse.json(result);
    }

    const result = await handleSeriesUpdate(event, enrichedBody, session.user.id);
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("PATCH error:", e);
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const mode = searchParams.get("mode");
  const instanceDate = searchParams.get("date");

  if (!id || !ObjectId.isValid(id))
    return NextResponse.json({ message: "Invalid event ID. Must be a MongoDB ObjectID" }, { status: 400 });

  try {
    const event = await prisma.event.findFirst({ where: { id, userId: session.user.id } });
    if (!event)
      return NextResponse.json({ message: "Event not found" }, { status: 404 });

    if (mode === "single" && instanceDate) {
      const dt = new Date(instanceDate);
      if (isNaN(dt.getTime()))
        return NextResponse.json({ message: "Invalid date" }, { status: 400 });

      const iso = dt.toISOString().split(".")[0] + "Z";

      if (event.googleEventId) {
        try {
          const calendar = await getGoogleCalendarClient(session.user.id);
          if (calendar) {
            const instanceId = `${event.googleEventId}_${iso.replace(/[-:]/g, "").split("T")[0]}Z`;
            await calendar.events.delete({ calendarId: "primary", eventId: instanceId });
          }
        } catch (err) {
          console.error("Google Single Instance Delete Failed:", err);
        }
      }

      const exceptions = event.exceptions || [];
      if (!exceptions.includes(iso)) {
        await prisma.event.update({ where: { id }, data: { exceptions: { push: iso } } });
      }

      return NextResponse.json({ success: true, message: "Occurrence removed" });
    }

    if (event.googleEventId) {
      try {
        const calendar = await getGoogleCalendarClient(session.user.id);
        if (calendar) {
          await calendar.events.delete({ calendarId: "primary", eventId: event.googleEventId });
        }
      } catch (err) {
        console.error("Google Series Delete Failed:", err);
      }
    }

    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Event deleted" });
  } catch (e: any) {
    console.error("Delete handler error:", e);
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}