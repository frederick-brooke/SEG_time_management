/**
 * @file useEventDelete.ts
 *
 * Hook for deleting calendar events with confirmation and undo support.
 */

import { useCallback } from "react";
import { getDeleteConfirmMsg, deleteEventRequest } from "./eventDeleteApi";

export function useEventDelete(
  refreshEvents: () => Promise<any[]>,
  triggerUndo: (event: any) => void,
) {
  return useCallback(
    async (selectedEvent: any, mode: "single" | "series") => {
      const { id } = selectedEvent;
      if (!id || !/^[a-f\d]{24}$/i.test(id)) {
        alert(`Invalid event ID: "${id}".`);
        return false;
      }
      if (!confirm(getDeleteConfirmMsg(mode))) return false;
      const instanceDate = (
        selectedEvent.start instanceof Date ? selectedEvent.start : new Date(selectedEvent.start)
      ).toISOString();
      const res = await deleteEventRequest(id, mode, instanceDate);
      if (!res.ok) { alert((await res.json()).message); return false; }
      triggerUndo(selectedEvent);
      refreshEvents();
      return true;
    },
    [refreshEvents, triggerUndo],
  );
}