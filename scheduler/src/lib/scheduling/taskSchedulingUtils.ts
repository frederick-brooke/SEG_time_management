/**
 * Utilities for computing task scheduling visibility based on recurring event patterns.
 * Provides next-occurrence deadline resolution for event-linked tasks and
 * determines whether a task should appear in the Unscheduled Tasks panel.
 */

import { addDays, addWeeks, addMonths } from "date-fns";

const DAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/** Returns the deadline for a non-recurring event shifted by `offset` days, or null if in the past. */
function getNonRecurringDeadline(event: any, offset: number, fromDay: Date): Date | null {
  const base = new Date(event.start);
  base.setHours(0, 0, 0, 0);
  const result = new Date(base);
  result.setDate(result.getDate() + offset);
  return result >= fromDay ? result : null;
}

/** Returns the next daily or monthly occurrence on or after `fromDay`, shifted by `offset`. */
function getSimpleRecurrenceDeadline(cursor: Date, offset: number): Date {
  const result = new Date(cursor);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + offset);
  return result;
}

/** Returns the earliest weekly occurrence in the current week on or after `fromDay`, shifted by `offset`. */
function getWeeklyDeadline(
  cursor: Date, recDays: string[], offset: number, fromDay: Date, limitDate: Date,
): Date | null {
  const weekStart = new Date(cursor);
  weekStart.setDate(cursor.getDate() - cursor.getDay());

  const candidates: Date[] = [];
  for (const day of recDays) {
    const idx = DAY_MAP[day];
    if (idx === undefined) continue;
    const occ = new Date(weekStart);
    occ.setDate(weekStart.getDate() + idx);
    occ.setHours(0, 0, 0, 0);
    if (occ >= fromDay && occ <= limitDate) candidates.push(occ);
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.getTime() - b.getTime());
  const result = new Date(candidates[0]);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + offset);
  return result;
}

/**
 * Given a recurring (or non-recurring) event and a relative offset in days,
 * returns the next occurrence date of the event ON OR AFTER `from` (default: today),
 * shifted by `relativeOffsetDays`.
 *
 * e.g. event recurs every Monday, offset = -1 → returns next Sunday
 *      event recurs every Monday, offset =  0 → returns next Monday
 */
export function getNextOccurrenceDeadline(
  event: any,
  relativeOffsetDays: number,
  from: Date = new Date(),
): Date | null {
  const offset = relativeOffsetDays ?? 0;
  const fromDay = new Date(from);
  fromDay.setHours(0, 0, 0, 0);

  if (!event.recurrence || event.recurrence.type === "none")
    return getNonRecurringDeadline(event, offset, fromDay);

  const { type, days: recDays, until } = event.recurrence;
  const limitDate = until ? new Date(until) : addMonths(fromDay, 12);

  let cursor = new Date(event.start);
  cursor.setHours(0, 0, 0, 0);
  let iterations = 0;

  while (cursor <= limitDate && iterations < 500) {
    iterations++;
    if (type === "daily") {
      if (cursor >= fromDay) return getSimpleRecurrenceDeadline(cursor, offset);
      cursor = addDays(cursor, 1);
    } else if (type === "monthly") {
      if (cursor >= fromDay) return getSimpleRecurrenceDeadline(cursor, offset);
      cursor = addMonths(cursor, 1);
    } else if (type === "weekly" && Array.isArray(recDays) && recDays.length > 0) {
      const result = getWeeklyDeadline(cursor, recDays, offset, fromDay, limitDate);
      if (result) return result;
      cursor = addWeeks(cursor, 1);
    } else {
      break;
    }
  }
  return null;
}

/**
 * Determines whether a task should appear in the Unscheduled Tasks panel.
 *
 * Rules:
 * 1. Completed tasks → never show
 * 2. Never scheduled (scheduledDate null) → always show
 * 3. Scheduled in the future → don't show (it's on the calendar)
 * 4. Scheduled in the past AND not completed:
 *    a. Non-recurring → show (missed)
 *    b. Recurring event-linked → show if the NEXT occurrence deadline
 *       is in the future (i.e. there's a new week coming up)
 */
export function shouldShowAsUnscheduled(task: any, events: any[]): boolean {
  if (task.completed) return false;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (!task.scheduledDate) return true;

  const scheduledDay = new Date(task.scheduledDate);
  scheduledDay.setHours(0, 0, 0, 0);

  if (scheduledDay >= now) return false;
  if (!task.isRecurring || !task.eventId) return true;

  const linkedEvent = events.find((e: any) => e.id === task.eventId);
  if (!linkedEvent) return true;

  const nextDeadline = getNextOccurrenceDeadline(linkedEvent, task.relativeOffsetDays ?? 0, now);
  return nextDeadline !== null;
}