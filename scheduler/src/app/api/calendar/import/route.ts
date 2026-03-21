import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { parseICal, parseRRule, ParsedVEvent } from "@/src/lib/ical-parser";

// ---------------------------------------------------------------------------
// Helpers — encode/decode the source URL inside googleEventId
// Format: ical:{base64(url)}:{uid}
// ---------------------------------------------------------------------------

function encodeImportId(url: string, uid: string): string {
  const encoded = Buffer.from(url).toString("base64");
  return `ical:${encoded}:${uid}`;
}

function encodeImportPrefix(url: string): string {
  const encoded = Buffer.from(url).toString("base64");
  return `ical:${encoded}:`;
}

function decodeImportUrl(googleEventId: string): string | null {
  if (!googleEventId.startsWith("ical:")) return null;
  const withoutPrefix = googleEventId.slice(5);
  const colonIdx = withoutPrefix.indexOf(":");
  if (colonIdx === -1) return null;
  try {
    return Buffer.from(withoutPrefix.slice(0, colonIdx), "base64").toString("utf-8");
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// POST helpers
// ---------------------------------------------------------------------------

function normaliseUrl(raw: string): string | null {
  try {
    const normalised = raw.replace(/^webcal:/i, "https:");
    const parsed = new URL(normalised);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    parsed.pathname = parsed.pathname.replace(/\/\/+/g, "/");
    return parsed.toString();
  } catch {
    return null;
  }
}

async function fetchICalText(url: string): Promise<{ text: string } | { error: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "text/calendar, text/html, application/xhtml+xml, */*",
        "Accept-Language": "en-GB,en;q=0.9",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
      signal: (() => { const c = new AbortController(); setTimeout(() => c.abort(), 15_000); return c.signal; })(),
    });
    console.log("Status:", response.status);
    console.log("Content-Type:", response.headers.get("content-type"));
    if (!response.ok) return { error: `Failed to fetch calendar: HTTP ${response.status}` };
    const text = await response.text();
    console.log("First 200 chars:", text.slice(0, 200));
    return { text };
  } catch (err: any) {
    console.error("iCal fetch error:", err);
    return { error: "Could not reach the calendar URL. Make sure it is publicly accessible." };
  }
}

function inferCategory(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("lecture") || t.includes("class") || t.includes("seminar")) return "Lecture";
  if (t.includes("lab") || t.includes("practical")) return "Lab";
  if (t.includes("exam") || t.includes("test") || t.includes("assessment")) return "Exam";
  if (t.includes("study") || t.includes("revision")) return "Individual Study";
  return "Personal";
}

async function updateICalEvent(
  existing: { id: string; description: string | null; recurrence: any; exceptions: string[] },
  ev: ParsedVEvent,
  recurrence: object | null,
  exceptions: string[],
): Promise<void> {
  await prisma.event.update({
    where: { id: existing.id },
    data: {
      title: ev.summary,
      description: ev.description ?? existing.description,
      start: ev.dtstart,
      end: ev.dtend,
      allDay: ev.allDay,
      recurrence: recurrence ?? existing.recurrence,
      exceptions: exceptions.length > 0 ? exceptions : existing.exceptions,
      lastSyncedAt: new Date(),
    },
  });
}

async function createICalEvent(
  userId: string,
  googleEventId: string,
  ev: ParsedVEvent,
  recurrence: object | null,
  exceptions: string[],
): Promise<void> {
  await prisma.event.create({
    data: {
      userId, googleEventId,
      title: ev.summary, description: ev.description ?? "",
      start: ev.dtstart, end: ev.dtend, allDay: ev.allDay,
      category: inferCategory(ev.summary),
      recurrence: recurrence ?? null, exceptions,
      lastSyncedAt: new Date(),
    },
  });
}

async function upsertICalEvent(
  ev: ParsedVEvent,
  url: string,
  userId: string,
): Promise<"created" | "updated"> {
  const importId = encodeImportId(url, ev.uid);
  const recurrence = ev.rrule ? parseRRule(ev.rrule) : null;
  const exceptions = ev.exdates.map((d) => d.toISOString());
  const existing = await prisma.event.findFirst({ where: { userId, googleEventId: importId } });
  if (existing) {
    await updateICalEvent(existing, ev, recurrence, exceptions);
    return "updated";
  }
  await createICalEvent(userId, importId, ev, recurrence, exceptions);
  return "created";
}


function parseICalFeed(icalText: string): ReturnType<typeof parseICal> | string {
  if (!icalText.includes("BEGIN:VCALENDAR") || !icalText.includes("BEGIN:VEVENT"))
    return "URL does not appear to be a valid iCal (.ics) calendar feed.";
  try {
    const parsed = parseICal(icalText);
    if (parsed.length === 0) return "No events found in this calendar feed.";
    return parsed;
  } catch (err: any) {
    console.error("iCal parse error:", err);
    return "Failed to parse calendar file.";
  }
}

// ---------------------------------------------------------------------------
// GET /api/calendar/import
// Returns a deduplicated list of all imported calendar feeds for this user,
// including the source URL and how many events came from it.
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const importedEvents = await prisma.event.findMany({
    where: {
      userId: session.user.id,
      googleEventId: { startsWith: "ical:" },
    },
    select: { googleEventId: true },
  });

  const feedMap = new Map<string, number>();
  for (const ev of importedEvents) {
    if (!ev.googleEventId) continue;
    const url = decodeImportUrl(ev.googleEventId);
    if (!url) continue;
    feedMap.set(url, (feedMap.get(url) ?? 0) + 1);
  }

  const feeds = Array.from(feedMap.entries()).map(([url, count]) => ({ url, count }));
  return NextResponse.json(feeds);
}

// ---------------------------------------------------------------------------
// POST /api/calendar/import
// Body: { url: string } — fetch and upsert events from an iCal feed
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  let url: string;
  try { const body = await req.json(); url = body?.url?.trim(); }
  catch { return NextResponse.json({ message: "Invalid request body" }, { status: 400 }); }
  if (!url) return NextResponse.json({ message: "No URL provided" }, { status: 400 });
  const normUrl = normaliseUrl(url);
  if (!normUrl) return NextResponse.json({ message: "Invalid URL format" }, { status: 400 });
  const fetched = await fetchICalText(normUrl);
  if ("error" in fetched) return NextResponse.json({ message: fetched.error }, { status: 422 });
  const feedResult = parseICalFeed(fetched.text);
  if (typeof feedResult === "string")
    return NextResponse.json({ message: feedResult }, { status: 422 });

  let created = 0, updated = 0, skipped = 0;
  for (const ev of feedResult) {
    try {
      const outcome = await upsertICalEvent(ev, normUrl, session.user.id);
      if (outcome === "created") created++; else updated++;
    } catch (err) {
      console.error("Error saving event:", ev.uid, err);
      skipped++;
    }
  }
  return NextResponse.json({
    message: `Import complete: ${created} created, ${updated} updated, ${skipped} skipped.`,
    created, updated, skipped, total: feedResult.length,
  });
}

// ---------------------------------------------------------------------------
// DELETE /api/calendar/import
// Body: { url: string } — removes ALL events imported from this feed URL
// ---------------------------------------------------------------------------

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  let url: string;
  try {
    const body = await req.json();
    url = body?.url?.trim();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  if (!url)
    return NextResponse.json({ message: "No URL provided" }, { status: 400 });
  const prefix = encodeImportPrefix(url);
  try {
    const result = await prisma.event.deleteMany({
      where: {
        userId: session.user.id,
        googleEventId: { startsWith: prefix },
      },
    });
    return NextResponse.json({
      message: `Removed ${result.count} event${result.count !== 1 ? "s" : ""} from this calendar.`,
      deleted: result.count,
    });
  } catch (err: any) {
    console.error("Import DELETE error:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}