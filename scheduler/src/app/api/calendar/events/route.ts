import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { addDays, addWeeks, addMonths, startOfDay, endOfDay } from "date-fns";
import { getGoogleCalendarClient } from "@/src/lib/googleCalendar";
import { ObjectId } from "mongodb";

// Global lock to prevent multiple syncs running at once per server instance 
let isSyncing = false;
let lastSyncTime = 0;
const SYNC_INTERVAL = 5 * 60 * 1000;

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
      ? e.exceptions.map((d: any) => new Date(d).toISOString().split('.')[0] + "Z") // Match the format
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
        const occIso = occ.toISOString().split('.')[0] + "Z";
        if (!exceptions.includes(occIso)) {
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
  const now = Date.now();
  
  const query = searchParams.get("q");
  const category = searchParams.get("category");

  const localCount = await prisma.event.count({ where: { userId: session.user.id } });

  const shouldSync = 
    searchParams.get("force") === "true" || 
    (now - lastSyncTime > SYNC_INTERVAL) || 
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
        const googleEvents = res.data.items || [];
        for (const ge of googleEvents) {
          if (!ge.id || ge.status === "cancelled") continue;

          await prisma.event.upsert({
            where: {
              googleEventId_userId: {
                googleEventId: ge.id,
                userId: session.user.id,
              },
            },
            update: {
              title: ge.summary || "Untitled",
              start: new Date(ge.start?.dateTime || ge.start?.date || now),
              end: new Date(ge.end?.dateTime || ge.end?.date || now),
            },
            create: {
              googleEventId: ge.id,
              userId: session.user.id,
              title: ge.summary || "Untitled",
              start: new Date(ge.start?.dateTime || ge.start?.date || now),
              end: new Date(ge.end?.dateTime || ge.end?.date || now),
              category: "Google",
            },
          });
        }
      }
    } finally {
      isSyncing = false;
    }
  }

  // --- Filtering & Response ---
  const filters: any = { userId: session.user.id };
  
  if (query) {
    filters.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }
  
  if (category && category !== "all") {
    filters.category = category;
  }

  const events = await prisma.event.findMany({ 
    where: filters, 
    orderBy: { start: "asc" } 
  });
  
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

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  try {
    const calendar = await getGoogleCalendarClient(session.user.id);
    if (!calendar) return NextResponse.json({ message: "No Google Calendar linked" }, { status: 400 });

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
          data: {
            title: ge.summary || "Untitled",
            start: startDt,
            end: endDt,
            description: ge.description || "",
            lastSyncedAt: new Date(),
          },
        });
        updated++;
      } else {
        await prisma.event.create({
          data: {
            googleEventId: ge.id,
            title: ge.summary || "Untitled",
            description: ge.description || "",
            start: startDt,
            end: endDt,
            userId: session.user.id,
            category: "Google",
            allDay: !ge.start?.dateTime,
            lastSyncedAt: new Date(),
          },
        });
        created++;
      }
    }

    return NextResponse.json({
      message: "Re-sync complete",
      created,
      updated,
      skipped,
      total: googleEvents.length,
    });
  } catch (err: any) {
    console.error("Force re-sync failed:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id, start, end, title, description, mode, originalDate } = await req.json();

  try {
    const event = await prisma.event.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!event) return NextResponse.json({ message: "Not found" }, { status: 404 });

    if (mode === "single" && originalDate) {
      await prisma.event.update({
        where: { id },
        data: { exceptions: { push: new Date(originalDate).toISOString() } },
      });

      let googleEventIdForNewEvent: string | null = null;

      if (event.googleEventId) {
        try {
          const calendar = await getGoogleCalendarClient(session.user.id);
          if (calendar) {
            const instanceId = `${event.googleEventId}_${new Date(originalDate)
              .toISOString()
              .replace(/[-:]/g, "")
              .split(".")[0]}Z`;

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

      const newStandalone = await prisma.event.create({
        data: {
          title: title || event.title,
          description: description || event.description,
          start: new Date(start),
          end: new Date(end),
          userId: session.user.id,
          category: event.category,
          googleEventId: googleEventIdForNewEvent,
        },
      });
      return NextResponse.json(newStandalone);
    }

    const newDateReq = new Date(start);
    const newEndDateReq = new Date(end);
    const originalMasterStart = new Date(event.start);

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
      },
    });

    if (updated.googleEventId) {
      try {
        const calendar = await getGoogleCalendarClient(session.user.id);
        if (calendar) {
          await calendar.events.patch({
            calendarId: "primary",
            eventId: updated.googleEventId,
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
    }
    
    return NextResponse.json(updated);

  } catch (e: any) {
    console.error("PATCH error:", e);
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const mode = searchParams.get("mode");
  const instanceDate = searchParams.get("date");

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
  }
  try {
    const event = await prisma.event.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!event) return NextResponse.json({ message: "Event not found" }, { status: 404 });

    if (mode === "single" && instanceDate) {
      
      if (event.googleEventId) {
        const calendar = await getGoogleCalendarClient(session.user.id);
        if (calendar) {
          try {
            const instanceId = `${event.googleEventId}_${new Date(instanceDate)
              .toISOString()
              .replace(/[-:]/g, "")
              .split(".")[0]}Z`;

            await calendar.events.delete({
              calendarId: "primary",
              eventId: instanceId,
            });
          } catch (err) {
            console.error("Google Single Instance Delete Failed:", err);
          }
        }
      }

      const iso = new Date(instanceDate).toISOString().split('.')[0] + "Z";
      await prisma.event.update({
        where: { id },
        data: { exceptions: { push: iso } },
      });

      return NextResponse.json({ success: true, message: "Instance removed" });
    }

    if (event.googleEventId) {
      const calendar = await getGoogleCalendarClient(session.user.id);
      if (calendar) {
        await calendar.events.delete({
          calendarId: "primary",
          eventId: event.googleEventId,
        });
      }
    }

    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Series deleted" });
  } catch (e: any) {
    console.error("Delete Error:", e);
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}