import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { addDays, addWeeks, addMonths } from "date-fns";

function expandRecurringEvents(events: any[]) {
  const allEvents: any[] = [];
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  events.forEach((e) => {
    if (!e.recurrence) {
      allEvents.push(e);
      return;
    }

    const { type, until, days } = e.recurrence;
    const start = new Date(e.start);
    const end = new Date(e.end);
    const untilDate = new Date(until);

    if (type === "daily") {
      let currentStart = new Date(start);
      let currentEnd = new Date(end);

      while (currentStart <= untilDate) {
        allEvents.push({
          ...e,
          start: new Date(currentStart),
          end: new Date(currentEnd),
        });

        currentStart = addDays(currentStart, 1);
        currentEnd = addDays(currentEnd, 1);
      }
    }

    if (type === "weekly" && Array.isArray(days)) {
      let cursor = new Date(start);

      while (cursor <= untilDate) {
        for (const day of days) {
          const targetDay = dayMap[day];
          const occurrence = new Date(cursor);
          occurrence.setDate(
            occurrence.getDate() + ((targetDay - occurrence.getDay() + 7) % 7),
          );
          if (occurrence < start || occurrence > untilDate) continue;

          const duration = end.getTime() - start.getTime();

          allEvents.push({
            ...e,
            start: new Date(occurrence),
            end: new Date(occurrence.getTime() + duration),
          });
        }

        cursor = addWeeks(cursor, 1);
      }
    }
    if (type === "monthly") {
      let currentStart = new Date(start);
      let currentEnd = new Date(end);

      while (currentStart <= untilDate) {
        allEvents.push({
          ...e,
          start: new Date(currentStart),
          end: new Date(currentEnd),
        });

        currentStart = addMonths(currentStart, 1);
        currentEnd = addMonths(currentEnd, 1);
      }
    }
  });

  return allEvents;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  const {
    title,
    description,
    start,
    end,
    allDay,
    category,
    recurrenceType,
    recurrenceDays,
    recurrenceUntil,
  } = await req.json();

  const recurrence =
    recurrenceType !== "none"
      ? {
          type: recurrenceType,
          until: recurrenceUntil,
          days: recurrenceType === "weekly" ? recurrenceDays : null,
        }
      : null;

  const localEvent = await prisma.event.create({
    data: {
      title,
      description,
      start: new Date(start),
      end: new Date(end),
      allDay: allDay || false,
      category: category || "Personal",
      userId: session.user.id,
      recurrence,
    },
  });

  return NextResponse.json(localEvent, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const localEvents = await prisma.event.findMany({
    where: { userId: session.user.id },
  });

  const expandedEvents = expandRecurringEvents(localEvents);

  return NextResponse.json(expandedEvents);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ message: "Missing ID" }, { status: 400 });

  try {
    const event = await prisma.event.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!event) return NextResponse.json({ message: "Event not found" }, { status: 404 });

    if (event.googleEventId) {
      const calendar = await getGoogleCalendarClient(session.user.id);
      if (calendar) {
        await calendar.events.delete({
          calendarId: "primary",
          eventId: event.googleEventId,
        });
      }
    }

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ message: "Failed to delete" }, { status: 500 });
  }
}
