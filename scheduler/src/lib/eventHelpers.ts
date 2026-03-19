// src/lib/eventHelpers.ts
import { addDays, addWeeks, addMonths, endOfDay } from "date-fns";

const DAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

// ---------------------------------------------------------------------------
// expandRecurringEvents
// Expands recurring events into individual occurrences up to 12 months ahead.
// ---------------------------------------------------------------------------
export function expandRecurringEvents(events: any[]) {
  const allEvents: any[] = [];

  events.forEach((e) => {
    if (!e.recurrence || e.recurrence.type === "none") {
      allEvents.push({ ...e, occurrenceId: e.id });
      return;
    }

    const { type, until, days } = e.recurrence;
    const exceptions = Array.isArray(e.exceptions)
      ? e.exceptions.map(
          (d: any) => new Date(d).toISOString().split(".")[0] + "Z",
        )
      : [];

    const start = new Date(e.start);
    const end = new Date(e.end);
    const duration = end.getTime() - start.getTime();
    const limitDate = until ? new Date(until) : addMonths(new Date(), 12);
    const finalLimit = endOfDay(limitDate);

    let cursor = new Date(start);
    let iterations = 0;

    while (cursor <= finalLimit && iterations < 366) {
      iterations++;
      const occurrencesThisPeriod: Date[] = [];

      if (type === "daily") {
        occurrencesThisPeriod.push(new Date(cursor));
        cursor = addDays(cursor, 1);
      } else if (type === "monthly") {
        occurrencesThisPeriod.push(new Date(cursor));
        cursor = addMonths(cursor, 1);
      } else if (type === "weekly" && Array.isArray(days)) {
        const weekStart = new Date(cursor);
        weekStart.setDate(cursor.getDate() - cursor.getDay());
        for (const day of days) {
          const occ = new Date(weekStart);
          const dayIndex = DAY_MAP[day];
          if (dayIndex !== undefined) {
            occ.setDate(weekStart.getDate() + dayIndex);
            occ.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), 0);
            if (occ >= start && occ <= finalLimit) occurrencesThisPeriod.push(occ);
          }
        }
        cursor = addWeeks(cursor, 1);
      } else {
        break;
      }

      occurrencesThisPeriod.forEach((occ) => {
        const occIso = occ.toISOString().split(".")[0] + "Z";
        if (!exceptions.includes(occIso)) {
          allEvents.push({
            ...e,
            start: new Date(occ),
            end: new Date(occ.getTime() + duration),
            occurrenceId: `${e.id}-${occ.getTime()}`,
          });
        }
      });
    }
  });

  return allEvents;
}

// ---------------------------------------------------------------------------
// buildGoogleRecurrenceRule
// Converts a local recurrence object into a Google Calendar RRULE string.
// ---------------------------------------------------------------------------
export function buildGoogleRecurrenceRule(recurrence: any): string[] | undefined {
  if (!recurrence || recurrence.type === "none" || !recurrence.until)
    return undefined;

  const untilDate = new Date(recurrence.until);
  const untilString =
    untilDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const freq = recurrence.type.toUpperCase();
  const byDay =
    recurrence.type === "weekly" && recurrence.days
      ? `;BYDAY=${recurrence.days.map((d: string) => d.toUpperCase().slice(0, 2)).join(",")}`
      : "";

  return [`RRULE:FREQ=${freq}${byDay};UNTIL=${untilString}`];
}