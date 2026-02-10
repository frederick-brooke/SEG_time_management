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
    allEvents.push({
            ...e,
            occurrenceId: e.id, 
          });
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
          occ.setDate(weekStart.getDate() + dayMap[day as keyof typeof dayMap]);
          occ.setHours(start.getHours(), start.getMinutes(), 0, 0);

          if (occ >= start && occ <= untilDate) {
            occurrencesThisPeriod.push(occ);
          }
        }
        cursor = addWeeks(cursor, 1);
      }

      occurrencesThisPeriod.forEach((occ) => {
        const isExcluded = exceptions.some((exc: any) =>
          isSameDay(new Date(exc), occ)
        );

        if (!isExcluded) {
          allEvents.push({
            ...e,
            start: new Date(occ),
            end: new Date(occ.getTime() + duration),
            occurrenceId: `${e.id}-${occ.getTime()}`,
          });
        }
      });

      if (type !== "weekly") continue;
    }
  });

  return allEvents;
}


function buildGoogleRecurrenceRule(recurrence: any): string[] | undefined {
  if (!recurrence || recurrence.type === "none") return undefined;

  const { type, until, days } = recurrence;
  const untilDate = new Date(until);
  const untilString =
    untilDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

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
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    id,
    title,
    description,
    start,
    end,
    allDay,
    category,
    recurrenceType,
    recurrenceDays,
    recurrenceUntil,
  } = body;

  const recurrenceData =
    recurrenceType && recurrenceType !== "none"
      ? {
          type: recurrenceType,
          until: recurrenceUntil ? new Date(recurrenceUntil) : null,
          days: recurrenceType === "weekly" && recurrenceDays ? recurrenceDays : null,
        }
      : null;

  try {
    let event;
    if (id) {
      const currentEvent = await prisma.event.findUnique({ where: { id } });
      const newStartDate = new Date(start);
      const newEndDate = new Date(end);

      let finalStart = newStartDate;
      let finalEnd = newEndDate;

      if (currentEvent?.recurrence && (currentEvent.recurrence as any).type !== "none") {
        const originalStart = new Date(currentEvent.start);
        finalStart = new Date(originalStart);
        finalStart.setHours(newStartDate.getHours(), newStartDate.getMinutes());

        const originalEnd = new Date(currentEvent.end);
        finalEnd = new Date(originalEnd);
        finalEnd.setHours(newEndDate.getHours(), newEndDate.getMinutes());
      }

      event = await prisma.event.update({
        where: { id },
        data: {
          title,
          description,
          start: finalStart,
          end: finalEnd,
          allDay,
          category,
          recurrence: recurrenceData,
        },
      });
    } else {
      // Create new event
      event = await prisma.event.create({
        data: {
          title,
          description,
          start: new Date(start),
          end: new Date(end),
          allDay: allDay || false,
          category: category || "Personal",
          userId: session.user.id,
          recurrence: recurrenceData,
        },
      });
    }

    try {
      const calendar = await getGoogleCalendarClient(session.user.id);
      if (calendar) {
        const googleRecurrence = buildGoogleRecurrenceRule(recurrenceData);
        const googlePayload = {
          summary: title,
          description: description || "",
          start: allDay
            ? { date: new Date(start).toISOString().split("T")[0] }
            : { dateTime: new Date(start).toISOString(), timeZone: "UTC" },
          end: allDay
            ? { date: new Date(end).toISOString().split("T")[0] }
            : { dateTime: new Date(end).toISOString(), timeZone: "UTC" },
          recurrence: googleRecurrence,
        };

        if (event.googleEventId) {
          await calendar.events.patch({
            calendarId: "primary",
            eventId: event.googleEventId,
            requestBody: googlePayload,
          });
        } else {
          const googleEvent = await calendar.events.insert({
            calendarId: "primary",
            requestBody: googlePayload,
          });

          event = await prisma.event.update({
            where: { id: event.id },
            data: { googleEventId: googleEvent.data.id || null },
          });
        }
      }
    } catch (error) {
      console.error("Google Calendar Sync Error:", error);
    }

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error("POST Error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
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
    if (startDate) filters.start.gte = new Date(startDate);
    if (endDate) filters.start.lte = new Date(endDate);
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
    const calendar = await getGoogleCalendarClient(session.user.id);
    if (calendar) {
      const now = new Date();
      const timeMin = startDate ? new Date(startDate).toISOString() : new Date(now.setMonth(now.getMonth() - 3)).toISOString();
      const timeMax = endDate ? new Date(endDate).toISOString() : new Date(now.setMonth(now.getMonth() + 6)).toISOString();

      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin,
        timeMax,
        singleEvents: true, 
        orderBy: "startTime",
      });

      googleEvents = (response.data.items || [])
        .filter((gEvent) => {
          const isAlreadyLocal = expandedLocalEvents.some((le) => {
            if (!le.googleEventId) return false;
            return gEvent.id === le.googleEventId || gEvent.id.startsWith(`${le.googleEventId}_`);
          });
          
          return !isAlreadyLocal;
        })
        .map((event) => {
          const eventStart = event.start?.dateTime || event.start?.date;
          const eventEnd = event.end?.dateTime || event.end?.date;
          
          return {
            id: `google-${event.id}`,
            title: event.summary || "(No title)",
            description: event.description || "",
            start: eventStart ? new Date(eventStart) : new Date(),
            end: eventEnd ? new Date(eventEnd) : new Date(),
            allDay: !event.start?.dateTime,
            category: "Google",
            googleEventId: event.id,
            isGoogleEvent: true,
          };
        });

      // Apply text search filter to Google events if needed
      if (query) {
        const searchQuery = query.toLowerCase();
        googleEvents = googleEvents.filter(e => 
          e.title.toLowerCase().includes(searchQuery) || 
          e.description.toLowerCase().includes(searchQuery)
        );
      }
    }
  } catch (error) {
    console.error("Google Fetch Error:", error);
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
    // Check if this is a Google-only event
    if (id.startsWith("google-")) {
      const googleEventId = id.replace("google-", "");
      const calendar = await getGoogleCalendarClient(session.user.id);
      if (!calendar) throw new Error("Calendar client not available");

      await calendar.events.delete({
        calendarId: "primary",
        eventId: googleEventId,
      });
      return NextResponse.json({ message: "Google event deleted" });
    }

    // Handle local events
    const event = await prisma.event.findUnique({
      where: { id, userId: session.user.id },
    });
    if (!event) return NextResponse.json({ message: "Event not found" }, { status: 404 });

    const calendar = await getGoogleCalendarClient(session.user.id);

    // 3. Handle SINGLE INSTANCE deletion
    if (mode === "single" && instanceDate) {
      const dateToExclude = new Date(instanceDate);
      const existingExceptions = Array.isArray(event.exceptions) ? event.exceptions : [];

      await prisma.event.update({
        where: { id },
        data: { exceptions: { set: [...existingExceptions, dateToExclude] } },
      });

      if (calendar && event.googleEventId) {
        try {
          const instances = await calendar.events.instances({
            calendarId: "primary",
            eventId: event.googleEventId,
            timeMin: new Date(dateToExclude.setHours(0,0,0,0)).toISOString(),
            timeMax: new Date(dateToExclude.setHours(23,59,59,999)).toISOString(),
            maxResults: 1,
          });

          const target = instances.data.items?.[0];
          if (target?.id) {
            await calendar.events.delete({ calendarId: "primary", eventId: target.id });
          }
        } catch (e) {
          console.error("Failed to delete Google instance:", e);
        }
      }
      return NextResponse.json({ message: "Instance removed" });
    } 

    if (calendar && event.googleEventId) {
      try {
        await calendar.events.delete({
          calendarId: "primary",
          eventId: event.googleEventId,
        });
      } catch (e) {
        console.error("Failed to delete Google series:", e);
      }
    }

    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ message: "Entire series deleted" });

  } catch (error: any) {
    console.error("Delete Error:", error);
    return NextResponse.json({ message: error.message || "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, start, end, mode, originalDate } = body;

  try {
    const event = await prisma.event.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!event)
      return NextResponse.json({ message: "Event not found" }, { status: 404 });

    let calendar = null;
    if (event.googleEventId) {
      calendar = await getGoogleCalendarClient(session.user.id);
    }

        // Handle single instance move for recurring events
    if (mode === "single" && originalDate) {
      const dateToExclude = new Date(originalDate);
      const existingExceptions = Array.isArray(event.exceptions) ? event.exceptions : [];

            // Add exception to recurring event
      await prisma.event.update({
        where: { id },
        data: { exceptions: { set: [...existingExceptions, dateToExclude] } },
      });

      // Create new standalone event for the moved instance
      const newStandalone = await prisma.event.create({
        data: {
          title: event.title,
          description: event.description,
          category: event.category,
          start: new Date(start),
          end: new Date(end),
          userId: session.user.id,
          recurrence: null,
        },
      });

      // Try to update Google Calendar instance
      if (calendar && event.googleEventId) {
        try {
          const instances = await calendar.events.instances({
            calendarId: "primary",
            eventId: event.googleEventId,
            timeMin: dateToExclude.toISOString(),
            maxResults: 1,
          });

          const targetInstance = instances.data.items?.[0];
          if (targetInstance?.id) {
            await calendar.events.patch({
              calendarId: "primary",
              eventId: targetInstance.id,
              requestBody: {
                start: { dateTime: new Date(start).toISOString() },
                end: { dateTime: new Date(end).toISOString() },
              },
            });
            console.log("Updated Google Calendar instance");
          }
        } catch (e) {
          console.error("Google instance move failed:", e);
        }
      }

      return NextResponse.json(newStandalone);
    }

    // Update entire event (or single non-recurring event)
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { start: new Date(start), end: new Date(end) },
    });

        // Update in Google Calendar
    if (calendar && event.googleEventId) {
      try {
        await calendar.events.patch({
          calendarId: "primary",
          eventId: event.googleEventId,
          requestBody: {
            start: { dateTime: new Date(start).toISOString() },
            end: { dateTime: new Date(end).toISOString() },
          },
        });
        console.log("Updated Google Calendar event series");
      } catch (e) {
        console.error("Failed to update Google Calendar series:", e);
      }
    }

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}