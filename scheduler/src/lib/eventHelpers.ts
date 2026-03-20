// src/lib/eventHelpers.ts
import { addDays, addWeeks, addMonths, endOfDay } from "date-fns";

const DAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

// ---------------------------------------------------------------------------
// expandRecurringEvents helpers
// ---------------------------------------------------------------------------

function getOccurrencesThisPeriod(
  type: string,
  cursor: Date,
  days: string[] | undefined,
  start: Date,
  finalLimit: Date,
): { occurrences: Date[]; nextCursor: Date } {
  if (type === "daily") {
    return { occurrences: [new Date(cursor)], nextCursor: addDays(cursor, 1) };
  }
  if (type === "monthly") {
    return { occurrences: [new Date(cursor)], nextCursor: addMonths(cursor, 1) };
  }
  if (type === "weekly" && Array.isArray(days)) {
    const weekStart = new Date(cursor);
    weekStart.setDate(cursor.getDate() - cursor.getDay());
    const occurrences = days.reduce<Date[]>((acc, day) => {
      const occ = new Date(weekStart);
      const dayIndex = DAY_MAP[day];
      if (dayIndex !== undefined) {
        occ.setDate(weekStart.getDate() + dayIndex);
        occ.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), 0);
        if (occ >= start && occ <= finalLimit) acc.push(occ);
      }
      return acc;
    }, []);
    return { occurrences, nextCursor: addWeeks(cursor, 1) };
  }
  return { occurrences: [], nextCursor: cursor };
}

function expandSingleEvent(e: any): any[] {
  if (!e.recurrence || e.recurrence.type === "none")
    return [{ ...e, occurrenceId: e.id }];

  const { type, until, days } = e.recurrence;
  const exceptions: string[] = Array.isArray(e.exceptions)
    ? e.exceptions.map((d: any) => new Date(d).toISOString().split(".")[0] + "Z")
    : [];
  const start = new Date(e.start);
  const duration = new Date(e.end).getTime() - start.getTime();
  const finalLimit = endOfDay(until ? new Date(until) : addMonths(new Date(), 12));

  const result: any[] = [];
  let cursor = new Date(start);
  let iterations = 0;

  while (cursor <= finalLimit && iterations < 366) {
    iterations++;
    const { occurrences, nextCursor } = getOccurrencesThisPeriod(type, cursor, days, start, finalLimit);
    if (occurrences.length === 0 && nextCursor === cursor) break;
    cursor = nextCursor;
    for (const occ of occurrences) {
      const occIso = occ.toISOString().split(".")[0] + "Z";
      if (!exceptions.includes(occIso))
        result.push({ ...e, start: new Date(occ), end: new Date(occ.getTime() + duration), occurrenceId: `${e.id}-${occ.getTime()}` });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// expandRecurringEvents
// Expands recurring events into individual occurrences up to 12 months ahead.
// ---------------------------------------------------------------------------
export function expandRecurringEvents(events: any[]): any[] {
  return events.flatMap((e) => expandSingleEvent(e));
}

// ---------------------------------------------------------------------------
// buildGoogleRecurrenceRule
// Converts a local recurrence object into a Google Calendar RRULE string.
// ---------------------------------------------------------------------------
export function buildGoogleRecurrenceRule(recurrence: any): string[] | undefined {
  if (!recurrence || recurrence.type === "none" || !recurrence.until)
    return undefined;
  const untilDate = new Date(recurrence.until);
  const untilString = untilDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const freq = recurrence.type.toUpperCase();
  const byDay =
    recurrence.type === "weekly" && recurrence.days
      ? `;BYDAY=${recurrence.days.map((d: string) => d.toUpperCase().slice(0, 2)).join(",")}`
      : "";
  return [`RRULE:FREQ=${freq}${byDay};UNTIL=${untilString}`];
}