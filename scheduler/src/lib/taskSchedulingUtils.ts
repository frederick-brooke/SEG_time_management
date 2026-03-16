import { addDays, addWeeks, addMonths } from "date-fns";

const DAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

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

  // Non-recurring event
  if (!event.recurrence || event.recurrence.type === "none") {
    const base = new Date(event.start);
    base.setHours(0, 0, 0, 0);
    const result = new Date(base);
    result.setDate(result.getDate() + offset);
    // Only return if it's still in the future
    return result >= fromDay ? result : null;
  }

  const { type, days: recDays, until } = event.recurrence;
  const limitDate = until ? new Date(until) : addMonths(fromDay, 12);

  let cursor = new Date(event.start);
  cursor.setHours(0, 0, 0, 0);
  let iterations = 0;

  while (cursor <= limitDate && iterations < 500) {
    iterations++;

    if (type === "daily") {
      if (cursor >= fromDay) {
        const result = new Date(cursor);
        result.setDate(result.getDate() + offset);
        return result;
      }
      cursor = addDays(cursor, 1);

    } else if (type === "monthly") {
      if (cursor >= fromDay) {
        const result = new Date(cursor);
        result.setDate(result.getDate() + offset);
        return result;
      }
      cursor = addMonths(cursor, 1);

    } else if (type === "weekly" && Array.isArray(recDays) && recDays.length > 0) {
      // Check all selected days in this week
      const weekStart = new Date(cursor);
      weekStart.setDate(cursor.getDate() - cursor.getDay()); // back to Sunday

      // Collect all occurrences in this week that are >= fromDay
      const candidates: Date[] = [];
      for (const day of recDays) {
        const idx = DAY_MAP[day];
        if (idx === undefined) continue;
        const occ = new Date(weekStart);
        occ.setDate(weekStart.getDate() + idx);
        occ.setHours(0, 0, 0, 0);
        if (occ >= fromDay && occ <= limitDate) {
          candidates.push(occ);
        }
      }

      if (candidates.length > 0) {
        // Pick the earliest candidate
        candidates.sort((a, b) => a.getTime() - b.getTime());
        const result = new Date(candidates[0]);
        result.setDate(result.getDate() + offset);
        return result;
      }

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

  // Never had a scheduled date → always unscheduled
  if (!task.scheduledDate) return true;

  const scheduledDay = new Date(task.scheduledDate);
  scheduledDay.setHours(0, 0, 0, 0);

  // Scheduled today or in the future → it's on the calendar, don't show
  if (scheduledDay >= now) return false;

  // Scheduled date is in the past and task is not completed
  // For non-recurring tasks → show as missed/unscheduled
  if (!task.isRecurring || !task.eventId) return true;

  // For recurring event-linked tasks → only show if there's a next
  // occurrence coming up that hasn't been scheduled yet
  const linkedEvent = events.find((e: any) => e.id === task.eventId);
  if (!linkedEvent) return true; // event deleted, show anyway

  const nextDeadline = getNextOccurrenceDeadline(
    linkedEvent,
    task.relativeOffsetDays ?? 0,
    now,
  );

  // There's a future occurrence → show in unscheduled
  return nextDeadline !== null;
}