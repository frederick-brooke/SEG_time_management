/**
 * @file undoApi.ts
 *
 * Utility function for restoring deleted calendar events.
 */

export async function restoreEvent(event: any) {
    return fetch("/api/calendar/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: event.title,
        description: event.description,
        start: event.start.toISOString(),
        end: event.end.toISOString(),
        allDay: event.allDay,
        category: event.category,
        recurrenceType: event.recurrence?.type || "none",
        recurrenceDays: event.recurrence?.days,
        recurrenceUntil: event.recurrence?.until,
      }),
    });
  }