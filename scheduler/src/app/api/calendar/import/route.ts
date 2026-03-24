/**
 * iCal Calendar Import API route handles importing external calendar feeds.
 * Supports fetching, parsing, and upserting iCal (.ics) feeds into the local database.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseICal, parseRRule, ParsedVEvent } from "@/lib/calendar/ical-parser";


/** Encodes a feed URL and event UID into the internal ical: googleEventId format. */
function encodeImportId(url: string, uid: string): string {
  const encoded = Buffer.from(url).toString("base64");
  return `ical:${encoded}:${uid}`;
}

/** Encodes a feed URL into the ical: prefix used for bulk lookups and deletions. */
function encodeImportPrefix(url: string): string {
  const encoded = Buffer.from(url).toString("base64");
  return `ical:${encoded}:`;
}

/**
 * Decodes the source feed URL from an ical: googleEventId.
 * @returns The original URL string, or null if the ID is malformed.
 */
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

/**
 * Normalises a raw calendar URL — converts webcal:// to https:// and
 * collapses double slashes in the path.
 * @returns The normalised URL string, or null if the URL is invalid.
 */
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

/**
 * Fetches the raw iCal text from a remote URL with a 15-second timeout.
 * @returns `{ text }` on success or `{ error }` if the request fails.
 */
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

/**
 * Infers a local category from an event title using keyword matching.
 * Falls back to "Personal" when no keywords match.
 */
function inferCategory(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("lecture") || t.includes("class") || t.includes("seminar")) return "Lecture";
  if (t.includes("lab") || t.includes("practical")) return "Lab";
  if (t.includes("exam") || t.includes("test") || t.includes("assessment")) return "Exam";
  if (t.includes("study") || t.includes("revision")) return "Individual Study";
  return "Personal";
}

/**
 * Updates an existing iCal-imported event in the database.
 * Preserves existing description and recurrence if the new values are absent.
 */
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

/**
 * Creates a new iCal-imported event in the database.
 * Category is inferred from the event title.
 */
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

/**
 * Upserts a single parsed iCal event — updates if it already exists, creates otherwise.
 * The googleEventId is encoded as `ical:{base64(url)}:{uid}` for traceability.
 */
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

/**
 * Validates and parses raw iCal text into an array of events.
 * @returns A parsed event array on success, or an error message string on failure.
 */
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

/**
 * GET /api/calendar/import
 * Returns a deduplicated list of imported calendar feeds for the user,
 * with the source URL and event count for each.
 */
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

/**
 * POST /api/calendar/import
 * Fetches and upserts all events from an iCal feed URL.
 * Normalises webcal:// URLs and validates the feed before importing.
 * @returns `{ created, updated, skipped, total }` summary on success,
 *   400 for invalid input, 422 for an unreachable or invalid feed, or 401 if not authenticated.
 */
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

/**
 * DELETE /api/calendar/import
 * Removes all events imported from a given feed URL by matching the encoded prefix.
 * @returns `{ deleted }` count on success, 400 for missing URL, or 401 if not authenticated.
 */
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