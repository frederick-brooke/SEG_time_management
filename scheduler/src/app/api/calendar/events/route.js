import { google } from "googleapis";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

async function getCalendar() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) return null;
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: session.accessToken });
  return google.calendar({ version: "v3", auth });
}

export async function GET() {
  const calendar = await getCalendar();
  if (!calendar) return new Response("Unauthorized", { status: 401 });
  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: (new Date(new Date().setMonth(new Date().getMonth() - 1))).toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });
  return new Response(JSON.stringify(response.data.items || []), { status: 200 });
}

export async function POST(req) {
  const calendar = await getCalendar();
  const { title, description, start, end } = await req.json();
  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: title,
      description,
      start: { dateTime: new Date(start).toISOString() },
      end: { dateTime: new Date(end).toISOString() },
    },
  });
  return new Response(JSON.stringify(response.data), { status: 200 });
}

export async function PUT(req) {
  const calendar = await getCalendar();
  const { id, title, description, start, end } = await req.json();
  const response = await calendar.events.update({
    calendarId: "primary",
    eventId: id,
    requestBody: {
      summary: title,
      description,
      start: { dateTime: new Date(start).toISOString() },
      end: { dateTime: new Date(end).toISOString() },
    },
  });
  return new Response(JSON.stringify(response.data), { status: 200 });
}

export async function DELETE(req) {
  const calendar = await getCalendar();
  const eventId = new URL(req.url).searchParams.get("eventId");
  await calendar.events.delete({ calendarId: "primary", eventId });
  return new Response("Deleted", { status: 200 });
}