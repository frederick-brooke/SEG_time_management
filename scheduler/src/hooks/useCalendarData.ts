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
 */

import { useState, useCallback, useMemo } from "react";
import { addDays, addWeeks, addMonths, addMinutes, subMinutes } from "date-fns";
import { shouldShowAsUnscheduled } from "@/lib/scheduling/taskSchedulingUtils";

interface Recurrence {
  type: "daily" | "weekly" | "monthly" | "none";
  days?: string[];
  until?: string;
}

interface Task {
  id: string;
  status?: string;
  isCompleted?: boolean;
  completed?: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
  duration?: number;
  isRecurring?: boolean;
  recurrence?: Recurrence;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  category?: string;
  travelDuration?: number;
  transportMode?: string;
  _type?: string;
}

interface ScheduledTask extends Task {
  start: Date;
  end: Date;
  occurrenceId?: string;
  _type: "task";
}

interface TravelBlock {
  _type: "_travel";
  _eventId: string;
  _eventCategory?: string;
  _transportMode: string;
  id: string;
  title: string;
  start: Date;
  end: Date;
}

interface Category {
  id: string;
  name: string;
}

interface ProgressCache {
  progressPercentage: number;
  tasks: Task[];
  lastUpdatedAt: number | null;
}

const DAY_MAP: Record<string, number> = {
	Sun: 0,
	Mon: 1,
	Tue: 2,
	Wed: 3,
	Thu: 4,
	Fri: 5,
	Sat: 6,
};

// ⚡ PERF: Simple cache for expanded recurring tasks to avoid re-expansion
const expandedTaskCache = new Map<string, any[]>();

function getCacheKey(task: any): string {
	return `${task.id}-${task.recurrence?.type}-${task.scheduledTime}-${task.duration}`;
}

/**
 * Fetches JSON from a URL, throwing on non-OK responses.
 * @param {string} url - The endpoint to fetch
 * @returns {Promise<any>} Parsed JSON response body
 * @throws {Error} On non-OK HTTP response
 */
async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

/** Returns occurrences for a single daily or monthly recurrence step. */
function getDailyOrMonthlyOccurrences(
	type: string,
	cursor: Date,
): { occurrences: Date[]; next: Date } {
	if (type === "daily") {
		return { occurrences: [new Date(cursor)], next: addDays(cursor, 1) };
	}
	return { occurrences: [new Date(cursor)], next: addMonths(cursor, 1) };
}

/** Returns all valid occurrences within a week for a weekly recurrence. */
function getWeeklyOccurrences(
	cursor: Date,
	days: string[],
	baseDate: Date,
	limitDate: Date,
): Date[] {
	const weekStart = new Date(cursor);
	weekStart.setDate(cursor.getDate() - cursor.getDay());
	return days.flatMap((day) => {
		const idx = DAY_MAP[day];
		if (idx === undefined) return [];
		const occ = new Date(weekStart);
		occ.setDate(weekStart.getDate() + idx);
		occ.setHours(baseDate.getHours(), baseDate.getMinutes(), 0, 0);
		return occ >= baseDate && occ <= limitDate ? [occ] : [];
	});
}

/** Converts a list of occurrence dates into calendar-ready task objects. */
function occurrencesToTasks(task: Task, occurrences: Date[], durationMins: number): ScheduledTask[] {
  return occurrences.map((occ) => ({
    ...task,
    start: new Date(occ),
    end: addMinutes(new Date(occ), durationMins),
    occurrenceId: `${task.id}-${occ.getTime()}`,
    _type: "task" as const,
  }));
}

/** Advances the cursor and returns occurrences for one recurrence step. */
function stepRecurrence(
  task: Task,
  cursor: Date,
  baseDate: Date,
  limitDate: Date,
): { occurrences: Date[]; next: Date } {
  const { type, days } = task.recurrence!;
  if (type === "weekly" && Array.isArray(days) && days.length > 0) {
    return {
      occurrences: getWeeklyOccurrences(cursor, days, baseDate, limitDate),
      next: addWeeks(cursor, 1),
    };
  }
  if (type === "daily" || type === "monthly") {
    return getDailyOrMonthlyOccurrences(type, cursor);
  }
  return { occurrences: [], next: limitDate };
}

/** Expands a single recurring task into all its individual occurrences. */
function expandSingleTask(task: Task): ScheduledTask[] {
  const { until } = task.recurrence!;
  const baseDate = task.scheduledTime
    ? new Date(task.scheduledTime)
    : task.scheduledDate ? new Date(task.scheduledDate) : new Date();
  const limitDate = until ? new Date(until) : addMonths(new Date(), 12);
  const durationMins = task.duration || 60;
  const result: ScheduledTask[] = [];
  let cursor = new Date(baseDate);
  let iterations = 0;
  while (cursor <= limitDate && iterations < 500) {
    iterations++;
    const { occurrences, next } = stepRecurrence(task, cursor, baseDate, limitDate);
    result.push(...occurrencesToTasks(task, occurrences, durationMins));
    cursor = next;
  }
  return result;
}

/** Expands all recurring tasks in a list into individual occurrences. */
export function expandRecurringTasks(tasks: Task[]): (Task | ScheduledTask)[] {
  return tasks.flatMap((task) => {
    if (!task.isRecurring || !task.recurrence || task.recurrence.type === "none") {
      return [task];
    }
    return expandSingleTask(task);
  });
}

function formatTravelDuration(minutes: number): string {
	if (minutes < 60) return `${minutes} min`;
	if (minutes % 60 === 0) return `${Math.floor(minutes / 60)}h`;
	return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/** Returns true if an event is eligible for a travel block. */
function isTravelEligible(ev: CalendarEvent): boolean {
  return (
    typeof ev.travelDuration === "number" &&
    ev.travelDuration > 0 &&
    ev._type !== "task" &&
    ev._type !== "_travel"
  );
}

/** Builds a single travel block that precedes a given event. */
function buildTravelBlock(ev: CalendarEvent): TravelBlock {
  const travelEnd = new Date(ev.start);
  const travelStart = subMinutes(travelEnd, ev.travelDuration!);
  return {
    _type: "_travel",
    _eventId: ev.id,
    _eventCategory: ev.category,
    _transportMode: ev.transportMode || "walking",
    id: `travel-${ev.id}`,
    title: `🚗 ${formatTravelDuration(ev.travelDuration!)} to ${ev.title}`,
    start: travelStart,
    end: travelEnd,
  };
}

/** Generates travel blocks for all eligible events. */
function buildTravelBlocks(events: CalendarEvent[]): TravelBlock[] {
  return events.filter(isTravelEligible).map(buildTravelBlock);
}

/** Fetches and maps raw calendar events, attaching travel blocks. */
async function fetchEvents(): Promise<(CalendarEvent | TravelBlock)[]> {
  const data = await fetchJson("/api/calendar/events");
  const mapped: CalendarEvent[] = data.map((e: any) => ({
    ...e,
    start: new Date(e.start),
    end: new Date(e.end),
    _type: "event",
  }));
  return [...mapped, ...buildTravelBlocks(mapped)];
}

/** Fetches raw tasks from the API and returns all non-completed ones. */
async function fetchRawTasks(userId: string): Promise<Task[]> {
  const data = await fetchJson(`/api/tasks?userId=${userId}`);
  return (data.tasks || []).filter((t: Task) => !t.completed);
}

/** Maps a scheduled task to a calendar-ready object with start/end times. */
function toScheduledTask(t: Task): ScheduledTask {
  return {
    ...t,
    start: new Date(t.scheduledTime!),
    end: addMinutes(new Date(t.scheduledTime!), t.duration || 60),
    _type: "task" as const,
  };
}

/** Fetches and maps category data, building an all-enabled filter map. */
async function fetchCategoryData(): Promise<{ cats: Category[]; filters: Record<string, boolean> }> {
  const data = await fetchJson("/api/categories");
  const cats: Category[] = data.categories || [];
  const filters = Object.fromEntries(cats.map((c) => [c.id, true]));
  return { cats, filters };
}

/**
 * Holds all raw calendar state slices.
 * Separated from action logic so each concern fits within the line budget.
 */
function useCalendarState() {
  const [events, setEvents]                     = useState<(CalendarEvent | TravelBlock)[]>([]);
  const [tasks, setTasks]                       = useState<(Task | ScheduledTask)[]>([]);
  const [unscheduledTasks, setUnscheduledTasks] = useState<Task[]>([]);
  const [allFetchedTasks, setAllFetchedTasks]   = useState<Task[]>([]);
  const [categories, setCategories]             = useState<Category[]>([]);
  const [categoryFilters, setCategoryFilters]   = useState<Record<string, boolean>>({});
  const [scheduleLogs, setScheduleLogs]         = useState<any[]>([]);
  const [exams, setExams]                       = useState<any[]>([]);
  return {
    events, setEvents,
    tasks, setTasks,
    unscheduledTasks, setUnscheduledTasks,
    allFetchedTasks, setAllFetchedTasks,
    categories, setCategories,
    categoryFilters, setCategoryFilters,
    scheduleLogs, setScheduleLogs,
    exams, setExams,
  };
}

/** Returns a stable callback that filters tasks down to those without a scheduled slot. */
function useComputeUnscheduled() {
  return useCallback(
    (allTasksList: Task[], latestEvents: (CalendarEvent | TravelBlock)[]) =>
      allTasksList.filter((t) => shouldShowAsUnscheduled(t, latestEvents)),
    [],
  );
}

/** Provides the refreshEvents action. */
function useRefreshEvents(setEvents: (e: (CalendarEvent | TravelBlock)[]) => void) {
  return useCallback(async (): Promise<(CalendarEvent | TravelBlock)[]> => {
    try {
      const withTravel = await fetchEvents();
      setEvents(withTravel);
      return withTravel;
    } catch (err) {
      console.error("Failed to refresh events:", err);
      return [];
    }
  }, [setEvents]);
}

/**
 * Normalises a raw task list into scheduled and expanded calendar tasks.
 * @param {Task[]} raw - Unfiltered tasks from the API
 * @returns {{ scheduled: (Task | ScheduledTask)[]; raw: Task[] }} Normalised task collections
 */
function buildScheduledTasks(raw: Task[]): (Task | ScheduledTask)[] {
  const scheduledRaw = raw
    .filter((t) => t.scheduledDate && t.scheduledTime)
    .map(toScheduledTask);
  return expandRecurringTasks(scheduledRaw);
}

/**
 * Applies a fetched task list to all relevant state slices.
 *
 * @param {Task[]} fetched - The raw tasks returned from the API
 * @param {(CalendarEvent | TravelBlock)[]} latestEvents - Current events for unscheduled computation
 * @param {ReturnType<typeof useCalendarState>} state - The calendar state slice setters
 * @param {ReturnType<typeof useComputeUnscheduled>} computeUnscheduled - Unscheduled filter callback
 */
function applyTaskState(
  fetched: Task[],
  latestEvents: (CalendarEvent | TravelBlock)[],
  state: ReturnType<typeof useCalendarState>,
  computeUnscheduled: ReturnType<typeof useComputeUnscheduled>,
): void {
  state.setAllFetchedTasks(fetched);
  state.setTasks(buildScheduledTasks(fetched));
  state.setUnscheduledTasks(computeUnscheduled(fetched, latestEvents));
}

/** Provides the refreshTasks action. */
function useRefreshTasks(
	state: ReturnType<typeof useCalendarState>,
	userId: string,
	computeUnscheduled: ReturnType<typeof useComputeUnscheduled>,
) {
  return useCallback(async (latestEvents?: (CalendarEvent | TravelBlock)[]): Promise<Task[] | null> => {
    try {
      const fetched = await fetchRawTasks(userId);
      applyTaskState(fetched, latestEvents ?? state.events, state, computeUnscheduled);
      return fetched;
    } catch (err) {
      console.error("Failed to refresh tasks:", err);
      return null;
    }
  }, [userId, state, computeUnscheduled]);
}

/** Provides category, schedule log, and exam fetch actions. */
function useMetaActions(state: ReturnType<typeof useCalendarState>) {
	const { setCategories, setCategoryFilters, setScheduleLogs, setExams } =
		state;

  const fetchCategories = useCallback(async (): Promise<void> => {
    const { cats, filters } = await fetchCategoryData();
    setCategories(cats);
    setCategoryFilters(filters);
  }, [setCategories, setCategoryFilters]);

  const fetchScheduleLogs = useCallback(async (): Promise<void> => {
    const data = await fetchJson("/api/schedule-log");
    setScheduleLogs(data.logs || []);
  }, [setScheduleLogs]);

  const fetchExams = useCallback(async (): Promise<void> => {
    try {
      const data = await fetchJson("/api/exams");
      setExams(data.exams || []);
    } catch (err) {
      console.error("Failed to fetch exams:", err);
    }
  }, [setExams]);

	return { fetchCategories, fetchScheduleLogs, fetchExams };
}

/**
 * Manages all calendar data: events, tasks, categories, schedule logs, and exams.
 * Composes useCalendarState, refresh actions, and meta actions into a single public API.
 * @param {string} userId - The authenticated user's ID
 * @returns {object} All calendar state and action callbacks
 */
export function useCalendarData(userId: string) {
  const state              = useCalendarState();
  const computeUnscheduled = useComputeUnscheduled();
  const refreshEvents      = useRefreshEvents(state.setEvents);
  const refreshTasks       = useRefreshTasks(state, userId, computeUnscheduled);
  const metaActions        = useMetaActions(state);
  return { ...state, computeUnscheduled, refreshEvents, refreshTasks, ...metaActions };
}
