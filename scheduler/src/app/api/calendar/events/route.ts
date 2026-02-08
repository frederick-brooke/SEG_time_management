import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { getGoogleCalendarClient } from "@/src/lib/googleCalendar";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const { title, description, start, end, allDay, category } = await req.json();

  const localEvent = await prisma.event.create({
    data: {
      title,
      description,
      start: new Date(start),
      end: new Date(end),
      allDay: allDay || false,
      category: category || "Personal",
      userId: session.user.id,
    },
  });

  const calendar = await getGoogleCalendarClient(session.user.id);
  if (calendar) {
    try {
      const gEvent = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary: title,
          description: description,
          start: { dateTime: new Date(start).toISOString() },
          end: { dateTime: new Date(end).toISOString() },
        },
      });

      await prisma.event.update({
        where: { id: localEvent.id },
        data: { googleEventId: gEvent.data.id },
      });
    } catch (err) {
      console.error("Google Sync Failed:", err);
    }
  }

  return NextResponse.json(localEvent, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const localEvents = await prisma.event.findMany({
    where: { userId: session.user.id },
  });

  let googleEvents = [];
  const calendar = await getGoogleCalendarClient(session.user.id);
  if (calendar) {
    try {
      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: "startTime",
      });
      googleEvents = response.data.items.map((ge) => ({
        id: ge.id,
        title: ge.summary,
        start: ge.start.dateTime || ge.start.date,
        end: ge.end.dateTime || ge.end.date,
        category: "Google",
        isGoogleEvent: true,
      }));
    } catch (err) {
      console.error("Fetch Google Failed:", err);
    }
  }

  return NextResponse.json([...localEvents, ...googleEvents]);
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
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const { id, title, description, start, end, category } = await req.json();

  try {
    const updatedEvent = await prisma.event.update({
      where: { id, userId: session.user.id },
      data: {
        title,
        description,
        start: new Date(start),
        end: new Date(end),
        category,
      },
    });
    return NextResponse.json(updatedEvent);
  } catch (error) {
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}
