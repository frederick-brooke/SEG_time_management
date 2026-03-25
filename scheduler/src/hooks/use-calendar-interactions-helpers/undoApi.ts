/**
 * @file undoApi.ts
 *
 * Utility functions for restoring deleted calendar events.
 * Handles two distinct cases:
 *   - "single"  — a single instance of a recurring event was deleted by
 *                 adding an exception date; undo removes that exception.
 *   - "full"    — a normal event or entire recurring series was deleted;
 *                 undo recreates it via POST.
 */

export type DeleteMode = "single" | "full";

export interface DeletableEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  category?: string;
  recurrence?: {
    type: string;
    days?: string[];
    until?: string;
  };
}

/**
 * Removes a single-instance exception from the parent recurring event.
 * Undo works by PATCHing the parent with mode "removeException", which
 * strips the instance date back out of the event's exceptions array.
 */
async function restoreSingleInstance(event: DeletableEvent) {
  return fetch("/api/calendar/events", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: event.id,
      mode: "removeException",
      exceptionDate: event.start.toISOString(),
    }),
  });
}

/** Recreates a fully deleted event or recurring series. */
async function restoreFullEvent(event: DeletableEvent) {
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
      recurrenceType: event.recurrence?.type ?? "none",
      recurrenceDays: event.recurrence?.days,
      recurrenceUntil: event.recurrence?.until,
    }),
  });
}

export async function restoreEvent(event: DeletableEvent, mode: DeleteMode) {
  if (mode === "single") return restoreSingleInstance(event);
  return restoreFullEvent(event);
}