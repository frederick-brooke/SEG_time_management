import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { addDays, addWeeks, addMonths, isSameDay } from "date-fns";
import { getGoogleCalendarClient } from "@/src/lib/googleCalendar";

function expandRecurringEvents(events: any[]) {
  const allEvents: any[] = [];
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  events.forEach((e) => {
    if (!e.recurrence || e.recurrence.type === "none") {
      allEvents.push(e);
      return;
    }

    const { type, until, days } = e.recurrence;
    const exceptions = e.exceptions || [];
    const start = new Date(e.start);
    const end = new Date(e.end);
    const untilDate = new Date(until);
    const duration = end.getTime() - start.getTime();

    let cursor = new Date(start);

    while (cursor <= untilDate) {
      let occurrencesThisPeriod = [];

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
          occ.setDate(weekStart.getDate() + dayMap[day]);
          occ.setHours(start.getHours(), start.getMinutes(), 0, 0);
          
          if (occ >= start && occ <= untilDate) {
            occurrencesThisPeriod.push(occ);
          }
        }
        cursor = addWeeks(cursor, 1);
      }

      occurrencesThisPeriod.forEach(occ => {
        const isExcluded = exceptions.some(exc => 
          isSameDay(new Date(exc), occ)
        );

        if (!isExcluded) {
          allEvents.push({
            ...e,
            start: new Date(occ),
            end: new Date(occ.getTime() + duration),
          });
        }
      });

      if (type !== "weekly") continue; 
    }
  });
  return allEvents;
}
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const events = await prisma.event.findMany({
    where: { userId: session.user.id }
  });

  const expanded = expandRecurringEvents(events);
  return NextResponse.json(expanded);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, title, description, start, end, allDay, category, googleEventId, recurrenceType, recurrenceDays, recurrenceUntil } = body;

  const recurrenceData = recurrenceType && recurrenceType !== "none" 
    ? {
        type: recurrenceType,
        until: recurrenceUntil,
        days: recurrenceType === "weekly" ? recurrenceDays : null,
      }
    : null;

  try {
    const event = await prisma.event.upsert({
      where: { id: id || "60d5ec1234567890abcdef12" }, 
      update: {
        title,
        description,
        start: new Date(start),
        end: new Date(end),
        allDay,
        category,
        recurrence: recurrenceData,
        ...(googleEventId ? { googleEventId } : {}),
      },
      create: {
        title,
        description,
        start: new Date(start),
        end: new Date(end),
        allDay: allDay || false,
        category: category || "Personal",
        userId: session.user.id,
        recurrence: recurrenceData,
        ...(googleEventId ? { googleEventId } : {}),
      },
    });

    return NextResponse.json(event, { status: 200 });
  } catch (error: any) {
    console.error("POST Error:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ message: "This event or sync ID already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const mode = searchParams.get("mode"); 
  const instanceDate = searchParams.get("date"); 

  if (!id) return NextResponse.json({ message: "Missing ID" }, { status: 400 });

  try {
    const event = await prisma.event.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!event) return NextResponse.json({ message: "Event not found" }, { status: 404 });

    if (event.googleEventId) {
      const calendar = await getGoogleCalendarClient(session.user.id);
      if (calendar) {
        try {
          await calendar.events.delete({ calendarId: "primary", eventId: event.googleEventId });
        } catch (e) { 
          console.error("Google Delete Failed:", e); 
        }
      }
    }

    if (mode === "single" && instanceDate) {
      const dateToExclude = new Date(instanceDate);
      const existingExceptions = Array.isArray(event.exceptions) ? event.exceptions : [];
      
      await prisma.event.update({
        where: { id },
        data: {
          exceptions: {
            set: [...existingExceptions, dateToExclude]
          },
        },
      });
      return NextResponse.json({ message: "Instance removed" });
    } else {
      await prisma.event.delete({ where: { id } });
      return NextResponse.json({ message: "Series deleted successfully" });
    }
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}