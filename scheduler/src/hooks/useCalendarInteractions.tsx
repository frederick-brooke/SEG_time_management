"use client";

/**
 * @file useCalendarInteractions.ts
 *
 * Composes all calendar interaction sub-hooks into a single interface
 * consumed by CalendarView.
 */

import { useUndoDelete } from "./use-calendar-interactions-helpers/useUndoDelete";
import { useEventSearch } from "./use-calendar-interactions-helpers/useEventSearch";
import { useEventDelete } from "./use-calendar-interactions-helpers/useEventDelete";
import { useTaskDelete } from "./use-calendar-interactions-helpers/useTaskDelete";
import { useTaskEdit } from "./use-calendar-interactions-helpers/useTaskEdit";

export function useCalendarInteractions(
  events: any[],
  refreshEvents: () => Promise<any[]>,
  refreshTasks: (e?: any[]) => Promise<any>,
) {
  const { showUndo, handleUndo, triggerUndo, dismissUndo } = useUndoDelete(refreshEvents);
  const search = useEventSearch();
  const deleteEvent = useEventDelete(refreshEvents, triggerUndo);
  const deleteTask = useTaskDelete(refreshTasks);
  const taskEdit = useTaskEdit(refreshTasks);

  return {
    showUndo, handleUndo, dismissUndo,
    ...search,
    deleteEvent,
    deleteTask,
    ...taskEdit,
  };
}