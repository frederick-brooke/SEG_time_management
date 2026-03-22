/**
 * Calendar Event Helpers
 * 
 * Provides utilities for expanding recurring events into individual occurrences
 * and converting local recurrence rules to Google Calendar RRULE format.
 *
 */

import { addDays, addWeeks, addMonths, endOfDay } from "date-fns";

const DAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/**
 * Computes the occurrences of a recurring event within the current iteration
 * period (day, week, or month) and advances the cursor to the next period.
 *
 * @param type - Recurrence type: `"daily"`, `"weekly"`, or `"monthly"`.
 * @param cursor - The start of the current iteration period.
 * @param days - For weekly recurrence, the days of the week to include.
 * @param start - The original event start time, used to set the time-of-day on each occurrence.
 * @param finalLimit - The date beyond which no occurrences should be generated.
 * @returns The occurrences within this period and the cursor advanced to the next period.
 */
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

/**
 * Expands a single event into an array of occurrence objects.
 * Non-recurring events are returned as-is with an `occurrenceId` attached.
 * Recurring events are expanded up to their `until` date or 12 months ahead,
 * with any dates listed in `exceptions` omitted.
 *
 * @param e - The raw event object from the database.
 * @returns An array of expanded occurrence objects, each with a unique `occurrenceId`.
 */
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

  // Cap at 366 to handle daily events over a leap year without risking infinite loop.
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

/**
 * Expands all events in the given array into individual occurrences.
 * Recurring events are flattened into one object per occurrence;
 * non-recurring events pass through unchanged.
 *
 * @param events - The raw event objects to expand.
 * @returns A flat array of all occurrences across all events.
 */
export function expandRecurringEvents(events: any[]): any[] {
  return events.flatMap((e) => expandSingleEvent(e));
}

/**
 * Converts a local recurrence rule object into a Google Calendar RRULE string array.
 * Returns `undefined` if the recurrence is absent, set to `"none"`, or has no `until` date.
 *
 * @param recurrence - The recurrence object containing `type`, `until`, and optionally `days`.
 * @returns A single-element array containing the RRULE string or `undefined` if no rule applies.
 */
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