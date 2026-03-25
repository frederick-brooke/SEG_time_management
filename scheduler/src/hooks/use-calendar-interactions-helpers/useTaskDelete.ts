/**
 * @file useTaskDelete.ts
 *
 * Hook for deleting tasks with confirmation.
 */

import { useCallback } from "react";

export function useTaskDelete(refreshTasks: (e?: any[]) => Promise<any>) {
  return useCallback(
    async (taskId: string) => {
      if (!confirm("Delete this task?")) return false;
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      refreshTasks();
      return true;
    },
    [refreshTasks],
  );
}