"use client";

/**
 * useSchedule
 *
 * Owns all state and logic for the "Schedule My Day / Week" flow.
 * CalendarView and ScheduleDrawer consume this hook — neither needs to
 * know how scheduling works internally.
 */

import { useState } from "react";
import { format, addDays, startOfWeek } from "date-fns";

// Types

export interface ScheduleState {
  showScheduleDialog: boolean;
  scheduleMode: "day" | "week";
  scheduleDate: string;
  scheduleWeekStart: string;
  selectedTaskIds: string[];
  unavailableDays: string[];
  showFutureTasks: boolean;
  futureModeAuto: boolean;
  selectedFutureTaskIds: string[];
  skipBreaks: boolean;
  breakSessionMins: number;
  breakLengthMins: number;
  isScheduling: boolean;
  requiresConfirmation: boolean;
  overCapacityTasks: any[];
  missedDeadlineTasks: any[];
  scheduleDialogTasks: any[];
}

interface SchedulePayload {
  taskIds: string[];
  days: string[];
  mode: "day" | "week";
  ignoreCapacity: boolean;
  dateLabel: string;
  breakOverrides: { sessionLength: number; breakLength: number };
}

interface ScheduleResponse {
  requiresConfirmation?: boolean;
  overCapacity?: any[];
  missedDeadline?: any[];
}

// Constants

const INITIAL_STATE: ScheduleState = {
  showScheduleDialog: false,
  scheduleMode: "day",
  scheduleDate: format(new Date(), "yyyy-MM-dd"),
  scheduleWeekStart: format(startOfWeek(new Date()), "yyyy-MM-dd"),
  selectedTaskIds: [],
  unavailableDays: [],
  showFutureTasks: false,
  futureModeAuto: true,
  selectedFutureTaskIds: [],
  skipBreaks: false,
  breakSessionMins: 60,
  breakLengthMins: 15,
  isScheduling: false,
  requiresConfirmation: false,
  overCapacityTasks: [],
  missedDeadlineTasks: [],
  scheduleDialogTasks: [],
};

// Pure utilities

/**
 * Strips the time component from a date for date-only comparisons.
 *
 * @param {Date} date - The date to normalise
 * @returns {Date} A new Date with time zeroed out
 */
function toDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Formats a schedule date string into a human-readable label.
 *
 * @param {"day" | "week"} mode - The scheduling mode
 * @param {string} scheduleDate - ISO date string for day mode
 * @param {string} scheduleWeekStart - ISO date string for week mode
 * @returns {string} A formatted label such as "Mon Apr 01" or "Week of Apr 01"
 */
function buildDateLabel(mode: "day" | "week", scheduleDate: string, scheduleWeekStart: string): string {
  if (mode === "day") {
    return format(new Date(`${scheduleDate}T12:00:00`), "EEE MMM dd");
  }
  return `Week of ${format(new Date(`${scheduleWeekStart}T12:00:00`), "MMM dd")}`;
}

/**
 * Builds the break overrides payload based on the current break settings.
 *
 * @param {boolean} skipBreaks - Whether breaks are skipped entirely
 * @param {number} breakSessionMins - Minutes per work session
 * @param {number} breakLengthMins - Minutes per break
 * @returns {{ sessionLength: number; breakLength: number }}
 */
function buildBreakOverrides(
  skipBreaks: boolean,
  breakSessionMins: number,
  breakLengthMins: number,
): { sessionLength: number; breakLength: number } {
  if (skipBreaks) return { sessionLength: 9999, breakLength: 0 };
  return { sessionLength: breakSessionMins, breakLength: breakLengthMins };
}

/**
 * Filters a task list to those falling within a given week range.
 *
 * @param {any[]} tasks - The full task list to filter
 * @param {Date} weekStart - Start of the week (inclusive)
 * @param {Date} weekEnd - End of the week (inclusive)
 * @returns {string[]} IDs of tasks scheduled within the week
 */
function getWeekTaskIds(tasks: any[], weekStart: Date, weekEnd: Date): string[] {
  return tasks
    .filter((t) => {
      if (!t.scheduledDate || t.completed) return false;
      const scheduled = toDateOnly(new Date(t.scheduledDate));
      return scheduled >= toDateOnly(weekStart) && scheduled <= toDateOnly(weekEnd);
    })
    .map((t) => t.id);
}

/**
 * Resolves the task IDs to include in a future-mode scheduling run.
 *
 * @param {boolean} futureModeAuto - Whether future tasks are auto-selected
 * @param {any[]} source - The full task source list
 * @param {string[]} selectedTaskIds - Currently selected task IDs
 * @param {string[]} weekIds - Task IDs already assigned to the current week
 * @param {string[]} selectedFutureTaskIds - Manually selected future task IDs
 * @returns {string[]} Resolved future task IDs
 */
function resolveFutureTaskIds(
  futureModeAuto: boolean,
  source: any[],
  selectedTaskIds: string[],
  weekIds: string[],
  selectedFutureTaskIds: string[],
): string[] {
  if (!futureModeAuto) return selectedFutureTaskIds;
  return source
    .filter((t) => !t.completed && !selectedTaskIds.includes(t.id) && !weekIds.includes(t.id))
    .map((t) => t.id);
}

// Hook

/**
 * Manages all state and logic for the schedule-my-day/week flow.
 *
 * @param {any[]} allFetchedTasks - The full list of tasks fetched by the calendar
 * @param {() => Promise<any>} refreshTasks - Callback to re-fetch tasks
 * @param {() => Promise<void>} fetchScheduleLogs - Callback to re-fetch schedule logs
 * @returns {object} Schedule state, patch function, and action callbacks
 */
export function useSchedule(
  allFetchedTasks: any[],
  refreshTasks: () => Promise<any>,
  fetchScheduleLogs: () => Promise<void>,
) {
  const [state, setState] = useState<ScheduleState>(INITIAL_STATE);

  const patch = (p: Partial<ScheduleState>) =>
    setState((prev) => ({ ...prev, ...p }));

  const resetWarnings = () =>
    patch({ requiresConfirmation: false, overCapacityTasks: [], missedDeadlineTasks: [] });

  const closeAndRefresh = async () => {
    patch({ showScheduleDialog: false, scheduleDialogTasks: [] });
    await refreshTasks();
    await fetchScheduleLogs();
  };

  const getScheduleDays = (): string[] => {
    const allDays =
      state.scheduleMode === "day"
        ? [format(new Date(state.scheduleDate), "yyyy-MM-dd")]
        : Array.from({ length: 7 }, (_, i) =>
            format(addDays(new Date(state.scheduleWeekStart), i), "yyyy-MM-dd"),
          );
    return allDays.filter((d) => !state.unavailableDays.includes(d));
  };

  const getFinalTaskIds = (): string[] => {
    const weekStart = new Date(`${state.scheduleWeekStart}T12:00:00`);
    const weekEnd   = addDays(weekStart, 6);
    const source    = state.scheduleDialogTasks.length > 0 ? state.scheduleDialogTasks : allFetchedTasks;

    const weekIds = state.scheduleMode === "week"
      ? getWeekTaskIds(source, weekStart, weekEnd)
      : [];

    const futureIds = state.showFutureTasks
      ? resolveFutureTaskIds(state.futureModeAuto, source, state.selectedTaskIds, weekIds, state.selectedFutureTaskIds)
      : [];

    return [...new Set([...weekIds, ...state.selectedTaskIds, ...futureIds])];
  };

  /**
   * Builds the full payload for the /api/schedule endpoint.
   *
   * @param {boolean} ignoreCapacity - Whether to bypass capacity checks
   * @returns {SchedulePayload} The request body
   */
  const buildSchedulePayload = (ignoreCapacity: boolean): SchedulePayload => ({
    taskIds: getFinalTaskIds(),
    days: getScheduleDays(),
    mode: state.scheduleMode,
    ignoreCapacity,
    dateLabel: buildDateLabel(state.scheduleMode, state.scheduleDate, state.scheduleWeekStart),
    breakOverrides: buildBreakOverrides(state.skipBreaks, state.breakSessionMins, state.breakLengthMins),
  });

  /**
   * Applies state patches in response to a schedule API response.
   *
   * @param {ScheduleResponse} data - The parsed API response body
   * @returns {Promise<void>}
   */
  const handleScheduleResponse = async (data: ScheduleResponse): Promise<void> => {
    if (data.requiresConfirmation) {
      patch({ requiresConfirmation: true, overCapacityTasks: data.overCapacity || [], missedDeadlineTasks: data.missedDeadline || [] });
      return;
    }
    if (data.missedDeadline && data.missedDeadline.length > 0) {
      patch({ missedDeadlineTasks: data.missedDeadline });
      return;
    }
    await closeAndRefresh();
  };

  /**
   * Opens the schedule dialog for a given mode and calendar date.
   *
   * @param {"day" | "week"} mode - Whether to schedule a day or week
   * @param {Date} calendarDate - The currently viewed calendar date
   * @returns {Promise<void>}
   */
  const open = async (mode: "day" | "week", calendarDate: Date): Promise<void> => {
    resetWarnings();
    patch({ showFutureTasks: false, futureModeAuto: true, selectedFutureTaskIds: [], unavailableDays: [] });
    const dateStr   = format(calendarDate, "yyyy-MM-dd");
    const freshTasks = (await refreshTasks()) || [];
    const unscheduledIds = freshTasks
      .filter((t: any) => !t.completed && !t.scheduledDate)
      .map((t: any) => t.id);
    patch({ showScheduleDialog: true, scheduleMode: mode, scheduleDate: dateStr, scheduleWeekStart: dateStr, selectedTaskIds: unscheduledIds, scheduleDialogTasks: freshTasks });
  };

  /**
   * Calls the schedule API and handles the response.
   *
   * @param {boolean} [ignoreCapacity=false] - Whether to bypass capacity warnings
   * @returns {Promise<void>}
   */
  const schedule = async (ignoreCapacity = false): Promise<void> => {
    patch({ isScheduling: true });
    resetWarnings();
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildSchedulePayload(ignoreCapacity)),
      });
      if (!res.ok) {
        console.error("Schedule error:", await res.text());
        return;
      }
      await handleScheduleResponse(await res.json());
    } finally {
      patch({ isScheduling: false });
    }
  };

  return { state, patch, open, schedule, close: closeAndRefresh, getScheduleDays };
}