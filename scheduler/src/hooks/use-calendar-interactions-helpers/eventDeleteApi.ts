/**
 * @file eventDeleteApi.ts
 *
 * Utility functions for deleting calendar events.
 */

export function getDeleteConfirmMsg(mode: "single" | "series") {
    return mode === "single"
      ? "Remove only this specific occurrence?"
      : "Delete the entire recurring series?";
  }
  
  export async function deleteEventRequest(
    id: string,
    mode: "single" | "series",
    instanceDate: string,
  ) {
    const params = new URLSearchParams({ id, mode });
    if (mode === "single") params.append("date", instanceDate);
    return fetch(`/api/calendar/events?${params}`, { method: "DELETE" });
  }