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

import { useState, useCallback, useMemo } from "react";
import { addDays, addWeeks, addMonths, addMinutes, subMinutes } from "date-fns";
import { shouldShowAsUnscheduled } from "@/lib/scheduling/taskSchedulingUtils";

/** Maps day abbreviations to JS day-of-week indices (0 = Sunday). */
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

async function fetchJson(url: string) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed to fetch ${url}`);
	return res.json();
}
// Recurring task expansion helpers

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
function occurrencesToTasks(
	task: any,
	occurrences: Date[],
	durationMins: number,
): any[] {
	return occurrences.map((occ) => ({
		...task,
		start: new Date(occ),
		end: addMinutes(new Date(occ), durationMins),
		occurrenceId: `${task.id}-${occ.getTime()}`,
		_type: "task",
	}));
}

/** Advances the cursor and returns occurrences for one recurrence step. */
function stepRecurrence(
	task: any,
	cursor: Date,
	baseDate: Date,
	limitDate: Date,
): { occurrences: Date[]; next: Date } {
	const { type, days } = task.recurrence;
	if (type === "weekly" && Array.isArray(days) && days.length > 0) {
		return {
			occurrences: getWeeklyOccurrences(
				cursor,
				days,
				baseDate,
				limitDate,
			),
			next: addWeeks(cursor, 1),
		};
	}
	if (type === "daily" || type === "monthly") {
		return getDailyOrMonthlyOccurrences(type, cursor);
	}
	// Unknown recurrence type — signal caller to stop iterating.
	return { occurrences: [], next: limitDate };
}

/** Expands a single recurring task into all its individual occurrences. */
// ⚡ PERF: Limited expansion window from 12 months to 30 days to reduce memory usage
function expandSingleTask(task: any): any[] {
	const { until } = task.recurrence;
	const baseDate = task.scheduledTime
		? new Date(task.scheduledTime)
		: task.scheduledDate
			? new Date(task.scheduledDate)
			: new Date();
	// Limit to 30 days instead of 12 months to prevent memory bloat
	const limitDate = until
		? new Date(
				Math.min(
					new Date(until).getTime(),
					addDays(new Date(), 30).getTime(),
				),
			)
		: addDays(new Date(), 30);
	const durationMins = task.duration || 60;
	const result: any[] = [];
	let cursor = new Date(baseDate);
	let iterations = 0;
	// ⚡ PERF: Reduced max iterations from 500 to 100 for this 30-day window
	while (cursor <= limitDate && iterations < 100) {
		iterations++;
		const { occurrences, next } = stepRecurrence(
			task,
			cursor,
			baseDate,
			limitDate,
		);
		result.push(...occurrencesToTasks(task, occurrences, durationMins));
		cursor = next;
	}
	return result;
}

/** Expands all recurring tasks in a list into individual occurrences. */
// ⚡ PERF: Added caching to avoid re-expanding the same recurring tasks
export function expandRecurringTasks(tasks: any[]): any[] {
	return tasks.flatMap((task) => {
		if (
			!task.isRecurring ||
			!task.recurrence ||
			task.recurrence.type === "none"
		) {
			return [task];
		}

		// Check cache first
		const cacheKey = getCacheKey(task);
		if (expandedTaskCache.has(cacheKey)) {
			return expandedTaskCache.get(cacheKey)!;
		}

		// Expand and cache
		const expanded = expandSingleTask(task);
		expandedTaskCache.set(cacheKey, expanded);

		// Keep cache size reasonable (max 100 entries)
		if (expandedTaskCache.size > 100) {
			const firstKey = expandedTaskCache.keys().next().value;
			expandedTaskCache.delete(firstKey);
		}

		return expanded;
	});
}

// Travel block helpers

/** Formats a duration in minutes into a human-readable string. */
function formatTravelDuration(minutes: number): string {
	if (minutes < 60) return `${minutes} min`;
	if (minutes % 60 === 0) return `${Math.floor(minutes / 60)}h`;
	return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/** Returns true if an event is eligible for a travel block. */
function isTravelEligible(ev: any): boolean {
	return (
		typeof ev.travelDuration === "number" &&
		ev.travelDuration > 0 &&
		ev._type !== "task" &&
		ev._type !== "_travel"
	);
}

/** Builds a single travel block that precedes a given event. */
function buildTravelBlock(ev: any): any {
	const travelEnd = new Date(ev.start);
	const travelStart = subMinutes(travelEnd, ev.travelDuration);
	return {
		_type: "_travel",
		_eventId: ev.id,
		_eventCategory: ev.category,
		_transportMode: ev.transportMode || "walking",
		id: `travel-${ev.id}`,
		title: `🚗 ${formatTravelDuration(ev.travelDuration)} to ${ev.title}`,
		start: travelStart,
		end: travelEnd,
	};
}

/** Generates travel blocks for all eligible events. */
function buildTravelBlocks(events: any[]): any[] {
	return events.filter(isTravelEligible).map(buildTravelBlock);
}

// API fetch helpers

/** Fetches and maps raw calendar events, attaching travel blocks. */
async function fetchEvents(): Promise<any[]> {
	const res = await fetch("/api/calendar/events");
	if (!res.ok) return [];
	const data = await res.json();
	const mapped = data.map((e: any) => ({
		...e,
		start: new Date(e.start),
		end: new Date(e.end),
		_type: "event",
	}));
	return [...mapped, ...buildTravelBlocks(mapped)];
}

/** Fetches raw tasks from the API and returns all non-completed ones. */
// ⚡ PERF: Fetch tasks with pagination to avoid loading all tasks at once
async function fetchRawTasks(userId: string): Promise<any[]> {
	try {
		// Fetch first 2 pages (40 tasks) for calendar view
		// Users can load more from the Tasks page with full pagination
		const allTasks: any[] = [];
		for (let page = 1; page <= 2; page++) {
			const res = await fetch(
				`/api/tasks?userId=${userId}&page=${page}&limit=20`,
			);
			if (!res.ok) break;
			const data = await res.json();
			if (!data.tasks || data.tasks.length === 0) break;
			allTasks.push(...data.tasks);
		}
		return allTasks.filter((t: any) => !t.completed);
	} catch (err) {
		console.error("Failed to fetch tasks:", err);
		return [];
	}
}

/** Maps a scheduled task to a calendar-ready object with start/end times. */
function toScheduledTask(t: any): any {
	return {
		...t,
		start: new Date(t.scheduledTime),
		end: addMinutes(new Date(t.scheduledTime), t.duration || 60),
		_type: "task",
	};
}

/** Fetches and maps category data, building an all-enabled filter map. */
async function fetchCategoryData(): Promise<{
	cats: any[];
	filters: Record<string, boolean>;
}> {
	const res = await fetch("/api/categories");
	const data = await res.json();
	const cats = data.categories || [];
	const filters: Record<string, boolean> = Object.fromEntries(
		cats.map((c: any) => [c.id, true]),
	);
	return { cats, filters };
}

// State hook

/**
 * Holds all raw calendar state slices.
 * Separated from action logic so each concern fits within the line budget.
 */
function useCalendarState() {
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
		setExams,
	};
}

// Action hooks (split by domain)

/** Returns a stable callback that filters tasks down to those without a scheduled slot. */
function useComputeUnscheduled() {
	return useCallback(
		(allTasksList: any[], latestEvents: any[]) =>
			allTasksList.filter((t: any) =>
				shouldShowAsUnscheduled(t, latestEvents),
			),
		[],
	);
}

/** Provides the refreshEvents action. */
function useRefreshEvents(setEvents: (e: any[]) => void) {
	return useCallback(async (): Promise<any[]> => {
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

/** Provides the refreshTasks action. */
function useRefreshTasks(
	state: ReturnType<typeof useCalendarState>,
	userId: string,
	computeUnscheduled: ReturnType<typeof useComputeUnscheduled>,
) {
	const { setAllFetchedTasks, setTasks, setUnscheduledTasks, events } = state;
	return useCallback(
		async (latestEvents?: any[]): Promise<any[] | null> => {
			try {
				const fresh = await fetchRawTasks(userId);
				setAllFetchedTasks(fresh);
				const scheduledRaw = fresh
					.filter((t) => t.scheduledDate && t.scheduledTime)
					.map(toScheduledTask);
				setTasks(expandRecurringTasks(scheduledRaw));
				setUnscheduledTasks(
					computeUnscheduled(fresh, latestEvents ?? events),
				);
				return fresh;
			} catch (err) {
				console.error("Failed to refresh tasks:", err);
				return null;
			}
		},
		[
			userId,
			events,
			computeUnscheduled,
			setAllFetchedTasks,
			setTasks,
			setUnscheduledTasks,
		],
	);
}

/** Provides category, schedule log, and exam fetch actions. */
function useMetaActions(state: ReturnType<typeof useCalendarState>) {
	const { setCategories, setCategoryFilters, setScheduleLogs, setExams } =
		state;

	/**
	 * Fetches available categories and initializes category filters.
	 */
	const fetchCategories = useCallback(async () => {
		const { cats, filters } = await fetchCategoryData();
		setCategories(cats);
		setCategoryFilters(filters);
	}, [setCategories, setCategoryFilters]);

	/**
	 * Fetches schedule logs from the API.
	 */
	const fetchScheduleLogs = useCallback(async () => {
		const data = await fetchJson("/api/schedule-log");
		setScheduleLogs(data.logs || []);
	}, [setScheduleLogs]);

	/**
	 * Fetches exams from the API.
	 */
	const fetchExams = useCallback(async () => {
		try {
			const data = await fetchJson("/api/exams");
			setExams(data.exams || []);
		} catch {}
	}, [setExams]);

	return { fetchCategories, fetchScheduleLogs, fetchExams };
}

// Public hook

/**
 * Manages all calendar data: events, tasks, categories, schedule logs, and exams.
 * Composes useCalendarState, useEventAndTaskActions, and useMetaActions into a single public API.
 */
export function useCalendarData(userId: string) {
	const state = useCalendarState();
	const computeUnscheduled = useComputeUnscheduled();
	const refreshEvents = useRefreshEvents(state.setEvents);
	const refreshTasks = useRefreshTasks(state, userId, computeUnscheduled);
	const metaActions = useMetaActions(state);
	return {
		...state,
		computeUnscheduled,
		refreshEvents,
		refreshTasks,
		...metaActions,
	};
}
