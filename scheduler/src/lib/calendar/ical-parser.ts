/**
 * iCalendar Parser
 *
 * Parses raw iCal (.ics) strings into structured event objects.
 * Handles all-day and timed events, DURATION-based end times, RRULE
 * recurrence, and EXDATE exclusions.
 */

export interface ParsedVEvent {
  uid: string;
  summary: string;
  description?: string;
  dtstart: Date;
  dtend: Date;
  allDay: boolean;
  rrule?: string;
  exdates: Date[];
}

type CurEvent = Partial<ParsedVEvent> & { durationRaw?: string };

/**
 * Unfolds iCal line continuations by joining lines that begin with a space or tab
 * into a single line.
 */
function unfold(raw: string): string {
  return raw.replace(/\r?\n[ \t]/g, " ");
}

/**
 * Parses an iCal date/time value into a Date and an `allDay` flag.
 *
 * @param value - The raw date/time string (e.g. `"20260321T090000Z"` or `"20260321"`).
 * @param params - The property parameter string (e.g. `"VALUE=DATE"`).
 */
function parseDt(value: string, params: string): { date: Date; allDay: boolean } {
  const allDay = params.includes("VALUE=DATE") || /^\d{8}$/.test(value.trim());
  const v = value.trim();
  if (allDay) {
    const y = +v.slice(0, 4), m = +v.slice(4, 6) - 1, d = +v.slice(6, 8);
    return { date: new Date(Date.UTC(y, m, d)), allDay: true };
  }
  const y = +v.slice(0, 4), mo = +v.slice(4, 6) - 1, d = +v.slice(6, 8);
  const h = +v.slice(9, 11), mi = +v.slice(11, 13), s = +v.slice(13, 15);
  const date = v.endsWith("Z")
    ? new Date(Date.UTC(y, mo, d, h, mi, s))
    : new Date(y, mo, d, h, mi, s);
  return { date, allDay: false };
}

/**
 * Adds an ISO 8601 duration string to a start date and returns the resulting end date.
 * Supports weeks, days, hours, minutes, and seconds (e.g. `"P1DT2H"`).
 *
 * @param start - The base date to add the duration to.
 * @param duration - An ISO 8601 duration string.
 */
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

/**
 * Splits a single iCal content line into its property name, parameters, and value.
 * Returns `null` for lines without a colon separator.
 *
 * @param line - A single unfolded iCal line.
 */
function parseLine(line: string): { propName: string; params: string; value: string } | null {
  const colonIdx = line.indexOf(":");
  
  if (colonIdx === -1) return null;
  
  const keyPart = line.slice(0, colonIdx);
  const value = line.slice(colonIdx + 1);
  const semicolonIdx = keyPart.indexOf(";");
  const propName = (semicolonIdx === -1 ? keyPart : keyPart.slice(0, semicolonIdx)).toUpperCase();
  const params = semicolonIdx === -1 ? "" : keyPart.slice(semicolonIdx + 1).toUpperCase();
  
  return { propName, params, value };
}

/**
 * Applies a single parsed iCal property to the event currently being built.
 * Handles UID, SUMMARY, DESCRIPTION, DTSTART, DTEND, DURATION, RRULE, and EXDATE.
 *
 * @param cur - The in-progress event object being populated.
 * @param propName - The uppercased property name
 * @param params - The uppercased parameter string
 * @param value - The raw property value.
 */
function applyProp(cur: CurEvent, propName: string, params: string, value: string): void {
  switch (propName) {
    case "UID": cur.uid = value.trim(); break;
    case "SUMMARY": cur.summary = value.trim(); break;
    case "DESCRIPTION":
      cur.description = value.replace(/\\n/g, "\n").replace(/\\,/g, ",").trim(); break;
    case "DTSTART": {
      const { date, allDay } = parseDt(value, params);
      cur.dtstart = date; cur.allDay = allDay; break;
    }
    case "DTEND":
      cur.dtend = parseDt(value, params).date; break;
    case "DURATION": cur.durationRaw = value.trim(); break;
    case "RRULE": cur.rrule = value.trim(); break;
    case "EXDATE":
      value.split(",").forEach((exv) => cur.exdates!.push(parseDt(exv.trim(), params).date)); break;
  }
}

/**
 * Finalises a parsed VEVENT block and pushes it to the results array if valid.
 * Computes a missing `dtend` from DURATION or, for all-day events, defaults to the next day.
 * Silently drops events missing any of: uid, summary, dtstart, dtend.
 *
 * @param cur - The completed in-progress event.
 * @param events - The accumulator array to push valid events into.
 */
function finaliseEvent(cur: CurEvent, events: ParsedVEvent[]): void {
  if (!cur.dtend && cur.dtstart && cur.durationRaw)
    cur.dtend = addDuration(cur.dtstart, cur.durationRaw);
  if (!cur.dtend && cur.dtstart && cur.allDay) {
    const d = new Date(cur.dtstart);
    d.setUTCDate(d.getUTCDate() + 1);
    cur.dtend = d;
  }
  if (cur.uid && cur.summary && cur.dtstart && cur.dtend)
    events.push(cur as ParsedVEvent);
}

/**
 * Converts an RRULE string into a local recurrence object compatible with the app's format.
 * 
 * @param rrule - A raw RRULE string, with or without the `RRULE:` prefix.
 * @returns A recurrence object `{ type, until, days? }`, or `null` if the frequency is unsupported.
 */
export function parseRRule(rrule: string): object | null {
  const parts: Record<string, string> = {};
  
  rrule.replace(/^RRULE:/i, "").split(";").forEach((p) => {
    const [k, v] = p.split("=");
    parts[k.toUpperCase()] = v;
  });
  
  const freq = parts["FREQ"]?.toLowerCase();
  
  if (!freq || !["daily", "weekly", "monthly"].includes(freq)) return null;
  
  const until = parts["UNTIL"] ? parseDt(parts["UNTIL"], "").date
    : parts["COUNT"] ? null
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  
    const days = freq === "weekly" && parts["BYDAY"]
    ? parts["BYDAY"].split(",").map((d) => {
        const map: Record<string, string> = { SU: "Sun", MO: "Mon", TU: "Tue", WE: "Wed", TH: "Thu", FR: "Fri", SA: "Sat" };
        return map[d.slice(-2).toUpperCase()] ?? d;
      })
    : undefined;
  
    return { type: freq, until: until ?? null, ...(days ? { days } : {}) };
}

/**
 * Parses a raw iCal string into an array of structured event objects.
 * Handles line unfolding, iterates VEVENT blocks, and delegates property
 * parsing and event finalisation to the helper functions above.
 *
 * @param raw - The full contents of an .ics file.
 * @returns All valid parsed events, in the order they appear in the file.
 */
export function parseICal(raw: string): ParsedVEvent[] {
  const lines = unfold(raw).split(/\r?\n/);
  const events: ParsedVEvent[] = [];
  
  let inEvent = false;
  let cur: CurEvent = {};

  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper === "BEGIN:VEVENT") { inEvent = true; cur = { exdates: [] }; continue; }
    if (upper === "END:VEVENT") { inEvent = false; finaliseEvent(cur, events); continue; }
    if (!inEvent) continue;
    const parsed = parseLine(line);
    if (parsed) applyProp(cur, parsed.propName, parsed.params, parsed.value);
  }

  return events;
}