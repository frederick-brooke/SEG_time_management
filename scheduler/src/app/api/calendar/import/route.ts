import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

// Minimal iCal parser 

interface ParsedVEvent {
  uid: string;
  summary: string;
  description?: string;
  dtstart: Date;
  dtend: Date;
  allDay: boolean;
  rrule?: string;
  exdates: Date[];
}

function unfold(raw: string): string {
  return raw.replace(/\r?\n[ \t]/g, "");
}

function parseDt(value: string, params: string): { date: Date; allDay: boolean } {
  const allDay = params.includes("VALUE=DATE") || /^\d{8}$/.test(value.trim());
  const v = value.trim();

  if (allDay) {
    const y = +v.slice(0, 4);
    const m = +v.slice(4, 6) - 1;
    const d = +v.slice(6, 8);
    return { date: new Date(Date.UTC(y, m, d)), allDay: true };
  }

  const y = +v.slice(0, 4);
  const mo = +v.slice(4, 6) - 1;
  const d = +v.slice(6, 8);
  const h = +v.slice(9, 11);
  const mi = +v.slice(11, 13);
  const s = +v.slice(13, 15);
  const isUtc = v.endsWith("Z");
  const date = isUtc
    ? new Date(Date.UTC(y, mo, d, h, mi, s))
    : new Date(y, mo, d, h, mi, s);

  return { date, allDay: false };
}

function addDuration(start: Date, duration: string): Date {
  const result = new Date(start);
  const m = duration.match(/P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/);
  if (!m) return result;
  const [, weeks, days, hours, mins, secs] = m.map((v) => parseInt(v ?? "0", 10) || 0);
  result.setDate(result.getDate() + weeks * 7 + days);
  result.setHours(result.getHours() + hours);
  result.setMinutes(result.getMinutes() + mins);
  result.setSeconds(result.getSeconds() + secs);
  return result;
}

function parseRRule(rrule: string): object | null {
  const parts: Record<string, string> = {};
  rrule.replace(/^RRULE:/i, "").split(";").forEach((p) => {
    const [k, v] = p.split("=");
    parts[k.toUpperCase()] = v;
  });

  const freq = parts["FREQ"]?.toLowerCase();
  if (!freq || !["daily", "weekly", "monthly"].includes(freq)) return null;

  const until = parts["UNTIL"]
    ? parseDt(parts["UNTIL"], "").date
    : parts["COUNT"]
    ? null
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const days =
    freq === "weekly" && parts["BYDAY"]
      ? parts["BYDAY"].split(",").map((d) => {
          const map: Record<string, string> = {
            SU: "Sun", MO: "Mon", TU: "Tue", WE: "Wed",
            TH: "Thu", FR: "Fri", SA: "Sat",
          };
          return map[d.slice(-2).toUpperCase()] ?? d;
        })
      : undefined;

  return { type: freq, until: until ?? null, ...(days ? { days } : {}) };
}

function parseICal(raw: string): ParsedVEvent[] {
  const text = unfold(raw);
  const lines = text.split(/\r?\n/);
  const events: ParsedVEvent[] = [];

  let inEvent = false;
  let cur: Partial<ParsedVEvent> & { durationRaw?: string } = {};

  for (const line of lines) {
    const upper = line.toUpperCase();

    if (upper === "BEGIN:VEVENT") {
      inEvent = true;
      cur = { exdates: [] };
      continue;
    }

    if (upper === "END:VEVENT") {
      inEvent = false;
      if (!cur.dtend && cur.dtstart && cur.durationRaw)
        cur.dtend = addDuration(cur.dtstart, cur.durationRaw);
      if (!cur.dtend && cur.dtstart && cur.allDay) {
        const d = new Date(cur.dtstart);
        d.setUTCDate(d.getUTCDate() + 1);
        cur.dtend = d;
      }
      if (cur.uid && cur.summary && cur.dtstart && cur.dtend)
        events.push(cur as ParsedVEvent);
      continue;
    }

    if (!inEvent) continue;

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const keyPart = line.slice(0, colonIdx);
    const value = line.slice(colonIdx + 1);
    const semicolonIdx = keyPart.indexOf(";");
    const propName = (semicolonIdx === -1 ? keyPart : keyPart.slice(0, semicolonIdx)).toUpperCase();
    const params = semicolonIdx === -1 ? "" : keyPart.slice(semicolonIdx + 1).toUpperCase();

    switch (propName) {
      case "UID": cur.uid = value.trim(); break;
      case "SUMMARY": cur.summary = value.trim(); break;
      case "DESCRIPTION":
        cur.description = value.replace(/\\n/g, "\n").replace(/\\,/g, ",").trim();
        break;
      case "DTSTART": {
        const { date, allDay } = parseDt(value, params);
        cur.dtstart = date;
        cur.allDay = allDay;
        break;
      }
      case "DTEND": {
        const { date } = parseDt(value, params);
        cur.dtend = date;
        break;
      }
      case "DURATION": cur.durationRaw = value.trim(); break;
      case "RRULE": cur.rrule = value.trim(); break;
      case "EXDATE": {
        const exVals = value.split(",");
        for (const exv of exVals) {
          const { date } = parseDt(exv.trim(), params);
          cur.exdates!.push(date);
        }
        break;
      }
    }
  }

  return events;
}

// Helpers — encode/decode the source URL inside googleEventId
// Format: ical:{base64(url)}:{uid}

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
  const withoutPrefix = googleEventId.slice(5); // remove "ical:"
  const colonIdx = withoutPrefix.indexOf(":");
  if (colonIdx === -1) return null;
  try {
    return Buffer.from(withoutPrefix.slice(0, colonIdx), "base64").toString("utf-8");
  } catch {
    return null;
  }
}

// GET /api/calendar/import
// Returns a deduplicated list of all imported calendar feeds for this user,
// including the source URL and how many events came from it.

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

  // Deduplicate by source URL
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

// POST /api/calendar/import
// Body: { url: string } — fetch and upsert events from an iCal feed

export async function POST(req: NextRequest) {
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

  try {
    const normalised = url.replace(/^webcal:/i, "https:");
    const parsed = new URL(normalised);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    parsed.pathname = parsed.pathname.replace(/\/\/+/g, "/");
    url = parsed.toString();
  } catch {
    return NextResponse.json({ message: "Invalid URL format" }, { status: 400 });
  }

  // Fetch the iCal feed server-side 
  let icalText: string;
  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "text/calendar, text/html, application/xhtml+xml, */*",
        "Accept-Language": "en-GB,en;q=0.9",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
      signal: AbortController
        ? (() => {
            const c = new AbortController();
            setTimeout(() => c.abort(), 15_000);
            return c.signal;
          })()
        : undefined,
    });

    console.log("Status:", response.status);
    console.log("Content-Type:", response.headers.get("content-type"));

    if (!response.ok)
      return NextResponse.json(
        { message: `Failed to fetch calendar: HTTP ${response.status}` },
        { status: 422 }
      );

    icalText = await response.text();
    console.log("First 200 chars:", icalText.slice(0, 200));

  } catch (err: any) {
    console.error("iCal fetch error:", err);
    return NextResponse.json(
      { message: "Could not reach the calendar URL. Make sure it is publicly accessible." },
      { status: 422 }
    );
  }

  if (!icalText.includes("BEGIN:VCALENDAR") || !icalText.includes("BEGIN:VEVENT"))
    return NextResponse.json(
      { message: "URL does not appear to be a valid iCal (.ics) calendar feed." },
      { status: 422 }
    );

  let parsed: ParsedVEvent[];
  try {
    parsed = parseICal(icalText);
  } catch (err: any) {
    console.error("iCal parse error:", err);
    return NextResponse.json({ message: "Failed to parse calendar file." }, { status: 422 });
  }

  if (parsed.length === 0)
    return NextResponse.json(
      { message: "No events found in this calendar feed." },
      { status: 422 }
    );

  let created = 0, updated = 0, skipped = 0;

  for (const ev of parsed) {
    try {
      const titleLower = ev.summary.toLowerCase();
      let category = "Personal";
      if (titleLower.includes("lecture") || titleLower.includes("class") || titleLower.includes("seminar"))
        category = "Lecture";
      else if (titleLower.includes("lab") || titleLower.includes("practical"))
        category = "Lab";
      else if (titleLower.includes("exam") || titleLower.includes("test") || titleLower.includes("assessment"))
        category = "Exam";
      else if (titleLower.includes("study") || titleLower.includes("revision"))
        category = "Individual Study";

      const recurrence = ev.rrule ? parseRRule(ev.rrule) : null;
      const exceptions = ev.exdates.map((d) => d.toISOString());
      const importId = encodeImportId(url, ev.uid);

      const existing = await prisma.event.findFirst({
        where: { userId: session.user.id, googleEventId: importId },
      });

      if (existing) {
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
        updated++;
      } else {
        await prisma.event.create({
          data: {
            userId: session.user.id,
            googleEventId: importId,
            title: ev.summary,
            description: ev.description ?? "",
            start: ev.dtstart,
            end: ev.dtend,
            allDay: ev.allDay,
            category,
            recurrence: recurrence ?? null,
            exceptions,
            lastSyncedAt: new Date(),
          },
        });
        created++;
      }
    } catch (err) {
      console.error("Error saving event:", ev.uid, err);
      skipped++;
    }
  }

  return NextResponse.json({
    message: `Import complete: ${created} created, ${updated} updated, ${skipped} skipped.`,
    created,
    updated,
    skipped,
    total: parsed.length,
  });
}

// DELETE /api/calendar/import
// Body: { url: string } — removes ALL events imported from this feed URL

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
