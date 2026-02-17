import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { addDays, addWeeks, addMonths, startOfDay, endOfDay } from "date-fns";
import { getGoogleCalendarClient } from "@/src/lib/googleCalendar";

// Global lock to prevent multiple syncs running at once per server instance 
let isSyncing = false;
let lastSyncTime = 0;
const SYNC_INTERVAL = 60 * 1000;

// --- HELPERS --- 

function expandRecurringEvents(events: any[]) {
  const allEvents: any[] = [];
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  events.forEach((e) => {
    if (!e.recurrence || e.recurrence.type === "none") {
      allEvents.push({ ...e, occurrenceId: e.id });
      return;
    }

    const { type, until, days } = e.recurrence;
    // Normalize exceptions - new Date(d) works with ISO strings
    const exceptions = Array.isArray(e.exceptions)
      ? e.exceptions.map((d: any) => startOfDay(new Date(d)).getTime())
      : [];
    const start = new Date(e.start);
    const end = new Date(e.end);
    const duration = end.getTime() - start.getTime();

    const limitDate = until ? new Date(until) : addMonths(new Date(), 12);
    const finalLimit = endOfDay(limitDate);

    let cursor = new Date(start);
    let iterations = 0;

    while (cursor <= finalLimit && iterations < 366) {
      iterations++;
      let occurrencesThisPeriod: Date[] = [];

      if (type === "daily") {
        occurrencesThisPeriod.push(new Date(cursor));
        cursor = addDays(cursor, 1);
      } else if (type === "monthly") {
        occurrencesThisPeriod.push(new Date(cursor));
        cursor = addMonths(cursor, 1);
      } else if (type === "weekly" && Array.isArray(days)) {
        let weekStart = new Date(cursor);
        weekStart.setDate(cursor.getDate() - cursor.getDay());
        for (const day of days) {
          let occ = new Date(weekStart);
          const dayIndex = dayMap[day as keyof typeof dayMap];
          if (dayIndex !== undefined) {
            occ.setDate(weekStart.getDate() + dayIndex);
            occ.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), 0);
            if (occ >= start && occ <= finalLimit) occurrencesThisPeriod.push(occ);
          }
        }
        cursor = addWeeks(cursor, 1);
      } else {
        break;
      }

      occurrencesThisPeriod.forEach((occ) => {
        if (!exceptions.includes(startOfDay(occ).getTime())) {
          allEvents.push({
            ...e,
            start: new Date(occ),
            end: new Date(occ.getTime() + duration),
            occurrenceId: `${e.id}-${occ.getTime()}`,
          });
        }
      });
    }
  });
  return allEvents;
}

function buildGoogleRecurrenceRule(recurrence: any): string[] | undefined {
  if (!recurrence || recurrence.type === "none" || !recurrence.until) return undefined;
  const untilDate = new Date(recurrence.until);
  const untilString = untilDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  let freq = recurrence.type.toUpperCase();
  let byDay = "";
  if (recurrence.type === "weekly" && recurrence.days) {
    byDay = `;BYDAY=${recurrence.days.map((d: string) => d.toUpperCase().slice(0, 2)).join(",")}`;
  }
  return [`RRULE:FREQ=${freq}${byDay};UNTIL=${untilString}`];
}

// --- HANDLERS --- 

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const category = searchParams.get("category");

  const now = Date.now();
  if (!isSyncing && (now - lastSyncTime > SYNC_INTERVAL)) {
    isSyncing = true;
    lastSyncTime = now;
    (async () => {
      try {
        const calendar = await getGoogleCalendarClient(session.user.id);
        if (!calendar) return;

        const res = await calendar.events.list({
          calendarId: "primary",
          timeMin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          singleEvents: false,
        });
        const googleEvents = res.data.items || [];
        for (const ge of googleEvents) {
          if (!ge.id || ge.status === "cancelled") continue;

          const startDt = ge.start?.dateTime ? new Date(ge.start.dateTime) : (ge.start?.date ? new Date(ge.start.date + 'T00:00:00Z') : new Date());
          const endDt = ge.end?.dateTime ? new Date(ge.end.dateTime) : (ge.end?.date ? new Date(ge.end.date + 'T00:00:00Z') : new Date());

          const localEvent = await prisma.event.findUnique({ where: { googleEventId: ge.id } });
          if (localEvent && localEvent.lastSyncedAt) {
            const timeSinceLastSync = Date.now() - new Date(localEvent.lastSyncedAt).getTime();
            if (timeSinceLastSync < 10000) continue;
          }

          await prisma.event.upsert({
            where: { googleEventId: ge.id },
            update: {
              title: ge.summary || "Untitled",
              start: startDt,
              end: endDt,
              description: ge.description || "",
              lastSyncedAt: new Date()
            },
            create: {
              googleEventId: ge.id,
              title: ge.summary || "Untitled",
              description: ge.description || "",
              start: startDt,
              end: endDt,
              userId: session.user.id,
              category: "Google",
              allDay: !ge.start?.dateTime,
              lastSyncedAt: new Date()
            },
          }).catch(() => { });
        }
      } finally {
        isSyncing = false;
      }
    })();
  }

  const filters: any = { userId: session.user.id };
  if (query) {
    filters.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }
  if (category && category !== "all") filters.category = category;

  const events = await prisma.event.findMany({ where: filters, orderBy: { start: "asc" } });
  return NextResponse.json(expandRecurringEvents(events));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, start, end, allDay, category, recurrenceType, recurrenceDays, recurrenceUntil } = body;

  const recurrenceData = (recurrenceType && recurrenceType !== "none")
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

    const event = await prisma.event.create({
      data: {
        title,
        description: description || "",
        start: new Date(start),
        end: new Date(end),
        allDay: !!allDay,
        category: category || "Personal",
        userId: session.user.id,
        recurrence: recurrenceData || undefined,
        googleEventId: googleEventId
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id, start, end, title, description, mode, originalDate } = await req.json();

  try {
    const event = await prisma.event.findUnique({
      where: { id, userId: session.user.id }
    });

    if (!event) return NextResponse.json({ message: "Not found" }, { status: 404 });

    // --- CASE 1: Single Instance Exception --- 
    if (mode === "single" && originalDate) {
      await prisma.event.update({
        where: { id },
        // FIXED: Convert Date to ISO String for Prisma String[]
        data: { exceptions: { push: new Date(originalDate).toISOString() } },
      });

      const newStandalone = await prisma.event.create({
        data: {
          title: title || event.title,
          description: description || event.description,
          start: new Date(start),
          end: new Date(end),
          userId: session.user.id,
          category: event.category,
        },
      });
      return NextResponse.json(newStandalone);
    }

    // --- CASE 2: Update Entire Series --- 
    const updated = await prisma.event.update({
      where: { id },
      data: {
        title: title || undefined,
        description: description || undefined,
        start: new Date(start),
        end: new Date(end)
      },
    });

    if (updated.googleEventId) {
      (async () => {
        try {
          const calendar = await getGoogleCalendarClient(session.user.id);
          if (calendar) {
            await calendar.events.patch({
              calendarId: "primary",
              eventId: updated.googleEventId!,
              requestBody: {
                summary: updated.title,
                description: updated.description || "",
                start: { dateTime: updated.start.toISOString(), timeZone: "UTC" },
                end: { dateTime: updated.end.toISOString(), timeZone: "UTC" }
              },
            });
          }
        } catch (err) {
          console.error("Google Update Failed:", err);
        }
      })();
    }
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const mode = searchParams.get("mode");
  const instanceDate = searchParams.get("date");

  if (!id) return NextResponse.json({ message: "ID required" }, { status: 400 });

  try {
    const event = await prisma.event.findUnique({
      where: { id, userId: session.user.id }
    });

    if (!event) return NextResponse.json({ message: "Not found" }, { status: 404 });

    if (mode === "single" && instanceDate) {
      await prisma.event.update({
        where: { id },
        // FIXED: Convert Date to ISO String for Prisma String[]
        data: { exceptions: { push: new Date(instanceDate).toISOString() } },
      });
      return NextResponse.json({ success: true });
    }

    if (event.googleEventId) {
      try {
        const calendar = await getGoogleCalendarClient(session.user.id);
        if (calendar) {
          await calendar.events.delete({
            calendarId: "primary",
            eventId: event.googleEventId
          });
        }
      } catch (err) {
        console.error("Google Delete Failed:", err);
      }
    }

    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}