"use client";

/**
 * Custom hook that manages all calendar-related data and operations.
 *
 * Responsibilities:
 * - Fetching and managing calendar events
 * - Fetching, transforming, and expanding recurring tasks
 * - Computing unscheduled tasks based on current events
 * - Managing categories, schedule logs, and exams
 *
 * Also provides helper actions for refreshing and fetching data from the API.
 *
 * This hook acts as the central data layer for the calendar feature.
 */

import { useState, useCallback } from "react";
import { addMinutes, subMinutes } from "date-fns";
import { shouldShowAsUnscheduled } from "@/lib/scheduling/taskSchedulingUtils";

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

/**
 * Returns the base date for a task using scheduledTime, scheduledDate, or now.
 */
function getBaseDate(task: any): Date {
  return task.scheduledTime
    ? new Date(task.scheduledTime)
    : task.scheduledDate
      ? new Date(task.scheduledDate)
      : new Date();
}

/**
 * Fetches JSON data from a given API endpoint.
 * Throws an error if the response is not OK.
 */
async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

/**
 * Maps raw event data into normalized event objects with Date fields.
 */
function mapEvents(data: any[]) {
  return data.map((e: any) => ({
    ...e,
    start: new Date(e.start),
    end: new Date(e.end),
    _type: "event",
  }));
}

/**
 * Filters and maps tasks that have scheduled dates into scheduled task objects.
 */
function mapScheduledTasks(tasks: any[]) {
  return tasks
    .filter((t: any) => t.scheduledDate && t.scheduledTime)
    .map((t: any) => ({
      ...t,
      start: new Date(t.scheduledTime),
      end: addMinutes(new Date(t.scheduledTime), t.duration || 60),
      _type: "task",
    }));
}

/**
 * Returns only tasks that are not completed.
 */
function extractUncompletedTasks(tasks: any[]) {
  return tasks.filter((t: any) => !t.completed);
}

/**
 * Generates weekly recurring occurrences based on selected days.
 */
function generateWeeklyOccurrences(
  cursor: Date,
  baseDate: Date,
  limitDate: Date,
  days: string[],
): Date[] {
  const occurrences: Date[] = [];
  const weekStart = new Date(cursor);
  weekStart.setDate(cursor.getDate() - cursor.getDay());

  for (const day of days) {
    const idx = DAY_MAP[day];
    if (idx === undefined) continue;

    const occ = new Date(weekStart);
    occ.setDate(weekStart.getDate() + idx);
    occ.setHours(baseDate.getHours(), baseDate.getMinutes(), 0, 0);

    if (occ >= baseDate && occ <= limitDate) {
      occurrences.push(occ);
    }
  }

  return occurrences;
}

/**
 * Generates a single daily occurrence.
 */
function generateDailyOccurrences(cursor: Date): Date[] {
  return [new Date(cursor)];
}

/**
 * Generates a single monthly occurrence.
 */
function generateMonthlyOccurrences(cursor: Date): Date[] {
  return [new Date(cursor)];
}

/**
 * Returns all occurrences for a recurring task.
 */
function getAllOccurrencesForTask(task: any): Date[] {
  const { type, until, days } = task.recurrence;
  const baseDate = getBaseDate(task);
  const limitDate = until ? new Date(until) : addMonths(new Date(), 12);

  let cursor = new Date(baseDate);
  let iterations = 0;
  const occurrences: Date[] = [];

  while (cursor <= limitDate && iterations < 500) {
    iterations++;
    if (type === "daily") {
      occurrences.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    } else if (type === "monthly") {
      occurrences.push(new Date(cursor));
      cursor = addMonths(cursor, 1);
    } else if (type === "weekly" && Array.isArray(days) && days.length > 0) {
      const weekOccurrences = generateWeeklyOccurrences(
        cursor,
        baseDate,
        limitDate,
        days,
      );

      occurrences.push(...weekOccurrences);
      cursor = addWeeks(cursor, 1);
    } else {
      break;
    }
  }
  return occurrences;
}

/**
 * Expands recurring tasks into individual occurrences based on recurrence rules.
 */
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

    const occurrences = getAllOccurrencesForTask(task);
    const durationMins = task.duration || 60;

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

  return result;
}

/**
 * Builds travel time blocks for events that have a travel duration.
 */
function buildTravelBlocks(events: any[]): any[] {
  const blocks: any[] = [];

  for (const ev of events) {
    if (typeof ev.travelDuration !== "number" || ev.travelDuration <= 0 || ev._type === "task" || ev._type === "_travel") {
      continue;
    }

    const travelEnd = new Date(ev.start);
    const travelStart = subMinutes(travelEnd, ev.travelDuration);

    blocks.push({
      _type: "_travel",
      _eventId: ev.id,
      _eventCategory: ev.category,
      _transportMode: ev.transportMode || "walking",
      id: `travel-${ev.id}`,
      title: `🚗 ${
        ev.travelDuration < 60
          ? `${ev.travelDuration} min`
          : ev.travelDuration % 60 === 0
            ? `${Math.floor(ev.travelDuration / 60)}h`
            : `${Math.floor(ev.travelDuration / 60)}h ${ev.travelDuration % 60}m`
      } to ${ev.title}`,
      start: travelStart,
      end: travelEnd,
    });
  }
  return blocks;
}

// Hook
export function useCalendarData(userId: string) {
  const [events, setEvents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [unscheduledTasks, setUnscheduledTasks] = useState<any[]>([]);
  const [allFetchedTasks, setAllFetchedTasks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<Record<string, boolean>>({});
  const [scheduleLogs, setScheduleLogs] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);

  /**
   * Computes tasks that should be shown as unscheduled based on current events.
   */
  const computeUnscheduled = useCallback(
    (allTasksList: any[], latestEvents: any[]) =>
      allTasksList.filter((t: any) =>
        shouldShowAsUnscheduled(t, latestEvents),
      ),
    [],
  );

  /**
   * Fetches and refreshes calendar events from the API.
   */
  const refreshEvents = useCallback(async (): Promise<any[]> => {
    try {
      const data = await fetchJson("/api/calendar/events");

      const mapped = mapEvents(data);
      const travelBlocks = buildTravelBlocks(mapped);
      const withTravel = [...mapped, ...travelBlocks];

      setEvents(withTravel);
      return withTravel;
    } catch (err) {
      console.error("Failed to refresh events:", err);
      return [];
    }
  }, []);

  /**
   * Fetches and refreshes tasks from the API, including recurring expansion and unscheduled filtering.
   */
  const refreshTasks = useCallback(
    async (latestEvents?: any[]): Promise<any[] | null> => {
      try {
        const data = await fetchJson(`/api/tasks?userId=${userId}`);
        const allRaw = data.tasks || [];

        const fresh = extractUncompletedTasks(allRaw);
        setAllFetchedTasks(fresh);

        const scheduled = mapScheduledTasks(allRaw);
        setTasks(expandRecurringTasks(scheduled));

        setUnscheduledTasks(
          computeUnscheduled(allRaw, latestEvents ?? events),
        );

        return fresh;
      } catch (err) {
        console.error("Failed to refresh tasks:", err);
        return null;
      }
    },
    [userId, events, computeUnscheduled],
  );

  /**
   * Fetches available categories and initializes category filters.
   */
  const fetchCategories = useCallback(async () => {
    const data = await fetchJson("/api/categories");
    const cats = data.categories || [];

    setCategories(cats);

    const filters: Record<string, boolean> = {};
    cats.forEach((c: any) => {
      filters[c.id] = true;
    });

    setCategoryFilters(filters);
  }, []);

  /**
   * Fetches schedule logs from the API.
   */
  const fetchScheduleLogs = useCallback(async () => {
    const data = await fetchJson("/api/schedule-log");
    setScheduleLogs(data.logs || []);
  }, []);

  /**
   * Fetches exams from the API.
   */
  const fetchExams = useCallback(async () => {
    try {
      const data = await fetchJson("/api/exams");
      setExams(data.exams || []);
    } catch {}
  }, []);

  return {
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

    refreshEvents,
    refreshTasks,
    fetchCategories,
    fetchScheduleLogs,
    fetchExams,
    computeUnscheduled,
  };
}