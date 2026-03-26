"use client";
// src/hooks/useSchedule.ts
// ---------------------------------------------------------------------------
// Owns all state and logic for the "Schedule My Day / Week" flow.
// CalendarView and ScheduleDrawer consume this hook — neither needs to
// know how scheduling works internally.
// ---------------------------------------------------------------------------
import { useState } from "react";
import { format, addDays } from "date-fns";
import { startOfWeek } from "date-fns";

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

export function useSchedule(
  allFetchedTasks: any[],
  refreshTasks: () => Promise<any>,
  fetchScheduleLogs: () => Promise<void>,
) {
  const [state, setState] = useState<ScheduleState>({
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
  });

  const patch = (p: Partial<ScheduleState>) =>
    setState((prev) => ({ ...prev, ...p }));

  const resetWarnings = () =>
    patch({
      requiresConfirmation: false,
      overCapacityTasks: [],
      missedDeadlineTasks: [],
    });

  // ── Open dialog ─
  const open = async (mode: "day" | "week", calendarDate: Date) => {
    resetWarnings();
    patch({
      showFutureTasks: false,
      futureModeAuto: true,
      selectedFutureTaskIds: [],
      unavailableDays: [],
    });
    const viewDate = new Date(calendarDate);
    const dateStr = format(viewDate, "yyyy-MM-dd");
    const freshTasks = (await refreshTasks()) || [];
    const unscheduledIds = freshTasks
      .filter((t: any) => !t.completed && !t.scheduledDate)
      .map((t: any) => t.id);
    patch({
      showScheduleDialog: true,
      scheduleMode: mode,
      scheduleDate: dateStr,
      scheduleWeekStart: dateStr,
      selectedTaskIds: unscheduledIds,
      scheduleDialogTasks: freshTasks,
    });
  };

  // ── Build day list for current mode ─────────
  const getScheduleDays = () => {
    const allDays =
      state.scheduleMode === "day"
        ? [format(new Date(state.scheduleDate), "yyyy-MM-dd")]
        : Array.from({ length: 7 }, (_, i) =>
            format(addDays(new Date(state.scheduleWeekStart), i), "yyyy-MM-dd"),
          );
    return allDays.filter((d) => !state.unavailableDays.includes(d));
  };

  // ── Compute final task ID list ────
  const getFinalTaskIds = () => {
    const ws = new Date(state.scheduleWeekStart + "T12:00:00");
    const we = addDays(ws, 6);
    const d0 = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const source =
      state.scheduleDialogTasks.length > 0
        ? state.scheduleDialogTasks
        : allFetchedTasks;

    const weekIds =
      state.scheduleMode === "week"
        ? source
            .filter((t: any) => {
              if (!t.scheduledDate || t.completed) return false;
              const sd = d0(new Date(t.scheduledDate));
              return sd >= d0(ws) && sd <= d0(we);
            })
            .map((t: any) => t.id)
        : [];

    const futureIds = state.showFutureTasks
      ? state.futureModeAuto
        ? source
            .filter(
              (t: any) =>
                !t.completed &&
                !state.selectedTaskIds.includes(t.id) &&
                !weekIds.includes(t.id),
            )
            .map((t: any) => t.id)
        : state.selectedFutureTaskIds
      : [];

    return [...new Set([...weekIds, ...state.selectedTaskIds, ...futureIds])];
  };

  // ── Run schedule API ────
  const schedule = async (ignoreCapacity = false) => {
    patch({ isScheduling: true });
    resetWarnings();
    const days = getScheduleDays();
    const taskIds = getFinalTaskIds();
    const dateLabel =
      state.scheduleMode === "day"
        ? format(new Date(state.scheduleDate + "T12:00:00"), "EEE MMM dd")
        : `Week of ${format(new Date(state.scheduleWeekStart + "T12:00:00"), "MMM dd")}`;

    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskIds,
        days,
        mode: state.scheduleMode,
        ignoreCapacity,
        dateLabel,
        breakOverrides: state.skipBreaks
          ? { sessionLength: 9999, breakLength: 0 }
          : {
              sessionLength: state.breakSessionMins,
              breakLength: state.breakLengthMins,
            },
      }),
    });

    patch({ isScheduling: false });
    if (!res.ok) {
      console.error("Schedule error:", await res.text());
      return;
    }

    const data = await res.json();

    if (data.requiresConfirmation) {
      patch({
        requiresConfirmation: true,
        overCapacityTasks: data.overCapacity || [],
        missedDeadlineTasks: data.missedDeadline || [],
      });
      return;
    }

    if (data.missedDeadline?.length > 0) {
      patch({ missedDeadlineTasks: data.missedDeadline });
      return;
    }

    patch({ showScheduleDialog: false, scheduleDialogTasks: [] });
    await refreshTasks();
    await fetchScheduleLogs();
  };

  const close = async () => {
    patch({ showScheduleDialog: false, scheduleDialogTasks: [] });
    await refreshTasks();
    await fetchScheduleLogs();
  };

  return { state, patch, open, schedule, close, getScheduleDays };
}
