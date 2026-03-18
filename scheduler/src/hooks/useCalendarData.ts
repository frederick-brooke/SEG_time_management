"use client";
import { useState, useCallback } from "react";
import { addMinutes } from "date-fns";
import { shouldShowAsUnscheduled } from "@/lib/taskSchedulingUtils";

// ---------------------------------------------------------------------------
// expandRecurringTasks — kept here since it's purely a data transformation
// ---------------------------------------------------------------------------
import { addDays, addWeeks, addMonths } from "date-fns";

const DAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function expandRecurringTasks(tasks: any[]): any[] {
  const result: any[] = [];
  for (const task of tasks) {
    if (
      !task.isRecurring ||
      !task.recurrence ||
      task.recurrence.type === "none"
    ) {
      result.push(task);
      continue;
    }
    const { type, until, days } = task.recurrence;
    const baseDate = task.scheduledTime
      ? new Date(task.scheduledTime)
      : task.scheduledDate
        ? new Date(task.scheduledDate)
        : new Date();
    const limitDate = until ? new Date(until) : addMonths(new Date(), 12);
    const durationMins = task.duration || 60;
    let cursor = new Date(baseDate);
    let iterations = 0;

    while (cursor <= limitDate && iterations < 500) {
      iterations++;
      const occurrences: Date[] = [];
      if (type === "daily") {
        occurrences.push(new Date(cursor));
        cursor = addDays(cursor, 1);
      } else if (type === "monthly") {
        occurrences.push(new Date(cursor));
        cursor = addMonths(cursor, 1);
      } else if (type === "weekly" && Array.isArray(days) && days.length > 0) {
        const weekStart = new Date(cursor);
        weekStart.setDate(cursor.getDate() - cursor.getDay());
        for (const day of days) {
          const idx = DAY_MAP[day];
          if (idx === undefined) continue;
          const occ = new Date(weekStart);
          occ.setDate(weekStart.getDate() + idx);
          occ.setHours(baseDate.getHours(), baseDate.getMinutes(), 0, 0);
          if (occ >= baseDate && occ <= limitDate) occurrences.push(occ);
        }
        cursor = addWeeks(cursor, 1);
      } else {
        break;
      }

      for (const occ of occurrences) {
        result.push({
          ...task,
          start: new Date(occ),
          end: addMinutes(new Date(occ), durationMins),
          occurrenceId: `${task.id}-${occ.getTime()}`,
          _type: "task",
        });
      }
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// useCalendarData
// ---------------------------------------------------------------------------
export function useCalendarData(userId: string) {
  const [events, setEvents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [unscheduledTasks, setUnscheduledTasks] = useState<any[]>([]);
  const [allFetchedTasks, setAllFetchedTasks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<
    Record<string, boolean>
  >({});
  const [scheduleLogs, setScheduleLogs] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);

  // ── helpers ───────────────────────────────────────────────────────────────

  const computeUnscheduled = useCallback(
    (allTasksList: any[], latestEvents: any[]) =>
      allTasksList.filter((t: any) => shouldShowAsUnscheduled(t, latestEvents)),
    [],
  );

  const refreshEvents = useCallback(async (): Promise<any[]> => {
    try {
      const res = await fetch("/api/calendar/events");
      if (!res.ok) return [];
      const data = await res.json();
      const mapped = data.map((e: any) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
        _type: "event",
      }));
      setEvents(mapped);
      return mapped;
    } catch (err) {
      console.error("Failed to refresh events:", err);
      return [];
    }
  }, []);

  const refreshTasks = useCallback(
    async (latestEvents?: any[]): Promise<any[] | null> => {
      try {
        const res = await fetch(`/api/tasks?userId=${userId}`);
        if (!res.ok) return null;
        const data = await res.json();
        const allRaw = data.tasks || [];
        const fresh = allRaw.filter((t: any) => !t.completed);
        setAllFetchedTasks(fresh);

        const scheduledRaw = allRaw
          .filter((t: any) => t.scheduledDate && t.scheduledTime)
          .map((t: any) => ({
            ...t,
            start: new Date(t.scheduledTime),
            end: addMinutes(new Date(t.scheduledTime), t.duration || 60),
            _type: "task",
          }));
        setTasks(expandRecurringTasks(scheduledRaw));

        setUnscheduledTasks(computeUnscheduled(allRaw, latestEvents ?? events));
        return fresh;
      } catch (err) {
        console.error("Failed to refresh tasks:", err);
        return null;
      }
    },
    [userId, events, computeUnscheduled],
  );

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    const cats = data.categories || [];
    setCategories(cats);
    const filters: Record<string, boolean> = {};
    cats.forEach((c: any) => {
      filters[c.id] = true;
    });
    setCategoryFilters(filters);
  }, []);

  const fetchScheduleLogs = useCallback(async () => {
    const res = await fetch("/api/schedule-log");
    const data = await res.json();
    setScheduleLogs(data.logs || []);
  }, []);

  const fetchExams = useCallback(async () => {
    try {
      const res = await fetch("/api/exams");
      const data = await res.json();
      setExams(data.exams || []);
    } catch {}
  }, []);

  return {
    // state
    events,
    setEvents,
    tasks,
    setTasks,
    unscheduledTasks,
    setUnscheduledTasks,
    allFetchedTasks,
    setAllFetchedTasks,
    categories,
    setCategories,
    categoryFilters,
    setCategoryFilters,
    scheduleLogs,
    setScheduleLogs,
    exams,
    // actions
    refreshEvents,
    refreshTasks,
    fetchCategories,
    fetchScheduleLogs,
    fetchExams,
    computeUnscheduled,
  };
}
