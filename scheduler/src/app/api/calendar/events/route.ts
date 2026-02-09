import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { addDays, addWeeks, addMonths, isSameDay } from "date-fns";
import { getGoogleCalendarClient } from "@/src/lib/googleCalendar";

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
    if (!e.recurrence || e.recurrence.type === "none") {
      allEvents.push(e);
      return;
    }

    const { type, until, days } = e.recurrence;
    const exceptions = e.exceptions || [];
    const start = new Date(e.start);
    const end = new Date(e.end);
    const untilDate = new Date(until);

    let currentStart = new Date(start);
    let currentEnd = new Date(end);

    if (type === "daily" || type === "monthly") {
      while (currentStart <= untilDate) {
        const isExcluded = exceptions.some((exc: any) =>
          isSameDay(new Date(exc), currentStart),
        );

        if (!isExcluded) {
          allEvents.push({
            ...e,
            start: new Date(currentStart),
            end: new Date(currentEnd),
          });
        }

        currentStart =
          type === "daily"
            ? addDays(currentStart, 1)
            : addMonths(currentStart, 1);
        currentEnd =
          type === "daily" ? addDays(currentEnd, 1) : addMonths(currentEnd, 1);
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

          const isExcluded = exceptions.some((exc: any) =>
            isSameDay(new Date(exc), occurrence),
          );

          if (!isExcluded) {
            const duration = end.getTime() - start.getTime();
            allEvents.push({
              ...e,
              start: new Date(occurrence),
              end: new Date(occurrence.getTime() + duration),
            });
          }
        }
        cursor = addWeeks(cursor, 1);
      }
    }
  });

  return allEvents;
}

function buildGoogleRecurrenceRule(recurrence: any): string[] | undefined {
  if (!recurrence || recurrence.type === "none") return undefined;

  const { type, until, days } = recurrence;
  const untilDate = new Date(until);
  const untilString = untilDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  let rule = "";

  switch (type) {
    case "daily":
      rule = `RRULE:FREQ=DAILY;UNTIL=${untilString}`;
      break;
    case "weekly":
      if (days && days.length > 0) {
        const daysUpper = days.map((d: string) => d.toUpperCase().slice(0, 2)).join(",");
        rule = `RRULE:FREQ=WEEKLY;BYDAY=${daysUpper};UNTIL=${untilString}`;
      } else {
        rule = `RRULE:FREQ=WEEKLY;UNTIL=${untilString}`;
      }
      break;
    case "monthly":
      rule = `RRULE:FREQ=MONTHLY;UNTIL=${untilString}`;
      break;
    default:
      return undefined;
  }

  return [rule];
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

  // Create event in local database
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

  // Sync to Google Calendar
  try {
    const calendar = await getGoogleCalendarClient((session.user as any).id);
    if (calendar) {
      const googleRecurrence = buildGoogleRecurrenceRule(recurrence);
      
      const googleEvent = await calendar.events.insert({
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
          recurrence: googleRecurrence,
        },
      });

      // Update local event with Google event ID for future reference
      await prisma.event.update({
        where: { id: localEvent.id },
        data: { googleEventId: googleEvent.data.id || null },
      });

      console.log("Event synced to Google Calendar:", googleEvent.data.id);
    } else {
      console.log("⚠️ Google Calendar client not available, event saved locally only");
    }
  } catch (error) {
    console.error("Failed to sync event to Google Calendar:", error);
  }

  return NextResponse.json(localEvent, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const category = searchParams.get("category");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  // Build filter conditions for local events
  const filters: any = {
    userId: session.user.id,
  };

  // Search by text (title or description)
  if (query) {
    filters.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  // Filter by category
  if (category && category !== "all") {
    filters.category = category;
  }

  // Filter by date range
  if (startDate || endDate) {
    filters.start = {};
    if (startDate) {
      filters.start.gte = new Date(startDate);
    }
    if (endDate) {
      filters.start.lte = new Date(endDate);
    }
  }

  // Fetch local events
  const localEvents = await prisma.event.findMany({
    where: filters,
    orderBy: { start: "asc" },
  });

  const expandedLocalEvents = expandRecurringEvents(localEvents);

  // Fetch Google Calendar events
  let googleEvents: any[] = [];
  try {
    const calendar = await getGoogleCalendarClient((session.user as any).id);
    if (calendar) {
      const now = new Date();
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const threeMonthsFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: startDate ? new Date(startDate).toISOString() : threeMonthsAgo.toISOString(),
        timeMax: endDate ? new Date(endDate).toISOString() : threeMonthsFromNow.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 250,
      });

      googleEvents = (response.data.items || [])
        .filter((event) => {
          const isLocalEvent = expandedLocalEvents.some(
            (le) => le.googleEventId === event.id
          );
          return !isLocalEvent;
        })
        .map((event) => {
          const eventStart = event.start?.dateTime || event.start?.date;
          const eventEnd = event.end?.dateTime || event.end?.date;
          const isAllDay = !event.start?.dateTime;

          return {
            id: `google-${event.id}`,
            title: event.summary || "(No title)",
            description: event.description || "",
            start: eventStart ? new Date(eventStart) : new Date(),
            end: eventEnd ? new Date(eventEnd) : new Date(),
            allDay: isAllDay,
            category: "Google",
            googleEventId: event.id,
            isGoogleEvent: true,
          };
        });

      if (query) {
        googleEvents = googleEvents.filter((event) => {
          const searchQuery = query.toLowerCase();
          return (
            event.title.toLowerCase().includes(searchQuery) ||
            event.description.toLowerCase().includes(searchQuery)
          );
        });
      }

      console.log(`Fetched ${googleEvents.length} events from Google Calendar`);
    }
  } catch (error) {
    console.error("Failed to fetch Google Calendar events:", error);
  }

  // Merge and sort all events
  const allEvents = [...expandedLocalEvents, ...googleEvents].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  return NextResponse.json(allEvents);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const mode = searchParams.get("mode");
  const instanceDate = searchParams.get("date");

  if (!id) return NextResponse.json({ message: "Missing ID" }, { status: 400 });

  try {
    if (id.startsWith("google-")) {
      const googleEventId = id.replace("google-", "");
      const calendar = await getGoogleCalendarClient((session.user as any).id);
      
      if (calendar) {
        await calendar.events.delete({
          calendarId: "primary",
          eventId: googleEventId,
        });
        console.log("Deleted Google Calendar event:", googleEventId);
        return NextResponse.json({ message: "Google event deleted successfully" });
      } else {
        return NextResponse.json(
          { message: "Cannot delete Google event: Calendar client not available" },
          { status: 500 }
        );
      }
    }

    // Handle local events
    const event = await prisma.event.findUnique({
      where: { id, userId: (session.user as any).id },
    });

    if (!event)
      return NextResponse.json({ message: "Event not found" }, { status: 404 });

    // Delete from Google Calendar if it was synced
    if (event.googleEventId) {
      try {
        const calendar = await getGoogleCalendarClient((session.user as any).id);
        if (calendar) {
          await calendar.events.delete({
            calendarId: "primary",
            eventId: event.googleEventId,
          });
          console.log("Deleted synced Google Calendar event:", event.googleEventId);
        }
      } catch (error) {
        console.error("⚠️ Failed to delete from Google Calendar:", error);
      }
    }

    // Handle recurring event instance deletion
    if (mode === "single" && instanceDate) {
      const dateToExclude = new Date(instanceDate + "T00:00:00Z");
      await prisma.event.update({
        where: { id },
        data: {
          exceptions: {
            push: dateToExclude,
          },
        },
      });
      return NextResponse.json({ message: "Instance removed from series" });
    } else {
      // Delete entire series
      await prisma.event.delete({
        where: { id },
      });
      return NextResponse.json({ message: "Event deleted successfully" });
    }
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ message: "Failed to delete" }, { status: 500 });
  }
}