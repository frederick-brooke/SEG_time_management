"use client";

/**
 * TaskProgressContext
 *
 * Global state for task progress tracking, including cached progress,
 * API syncing, and cross-tab updates via custom events and localStorage.
 */

import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
	useRef,
} from "react";

interface Task {
	id: string;
	status?: string;
	isCompleted?: boolean;
}

interface ProgressCache {
	progressPercentage: number;
	tasks: Task[];
	lastUpdatedAt: number | null;
}

interface TaskProgressContextType {
	progressPercentage: number;
	tasks: Task[];
	isLoading: boolean;
	lastUpdatedAt: number | null;
	refreshProgress: (userId: string | undefined) => Promise<void>;
	triggerProgressUpdate: () => void;
}

const PROGRESS_SYNC_EVENT = "task-progress-updated";
const PROGRESS_STORAGE_KEY = "task-progress-cache";

const TaskProgressContext = createContext<TaskProgressContextType | undefined>(
	undefined,
);

/**
 * Reads and parses the progress cache from localStorage.
 * Returns null if the key is missing or the value is malformed.
 *
 * @returns {ProgressCache | null} The cached progress data, or null on failure
 */
function readProgressCache(): ProgressCache | null {
	const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as ProgressCache;
	} catch {
		console.error("Failed to parse progress cache from localStorage");
		return null;
	}
}

/**
 * Writes a progress cache entry to localStorage.
 *
 * @param {ProgressCache} cache - The progress data to persist
 * @returns {void}
 */
function writeProgressCache(cache: ProgressCache): void {
	localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(cache));
}

/**
 * Calculates the percentage of completed tasks, rounded to the nearest integer.
 *
 * @param {Task[]} tasks - The full list of tasks
 * @returns {number} A value between 0 and 100 inclusive
 */
function calculateProgress(tasks: Task[]): number {
	if (tasks.length === 0) return 0;
	const completed = tasks.filter(
		(t) => t.status === "completed" || t.isCompleted === true,
	).length;
	return Math.floor((completed / tasks.length) * 100);
}

/**
 * Fetches raw task data from the API for the given user.
 * Returns null and logs a warning or error on any failure.
 *
 * @param {string} userId - The ID of the user whose tasks to fetch
 * @returns {Promise<Task[] | null>} The array of tasks, or null on failure
 */
async function fetchTasks(userId: string): Promise<Task[] | null> {
	const res = await fetch(`/api/tasks?userId=${userId}`);

	if (!res.ok) {
		console.warn(`API /api/tasks responded with status ${res.status}`);
		return null;
	}

	const text = await res.text();
	if (!text) {
		console.warn("Empty response body from /api/tasks");
		return null;
	}

	try {
		const data = JSON.parse(text);
		return Array.isArray(data) ? data : (data.tasks ?? []);
	} catch (e) {
		console.error(
			"Failed to parse JSON response from /api/tasks",
			e as SyntaxError,
		);
		return null;
	}
}

/**
 * Dispatches the progress sync custom event to notify all listeners.
 *
 * @returns {void}
 */
function broadcastProgressUpdate(): void {
	window.dispatchEvent(new Event(PROGRESS_SYNC_EVENT));
}

/**
 * Provides task progress state to all child components, including
 * localStorage persistence and cross-tab synchronisation via custom events.
 *
 * @param {{ children: React.ReactNode }} props - Child components to wrap
 * @returns {JSX.Element} The context provider wrapping its children
 */
export function TaskProgressProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [progressPercentage, setProgressPercentage] = useState(0);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

	// Debounce pending writes to localStorage
	const cacheWriteTimeout = useRef<NodeJS.Timeout | null>(null);
	const pendingCache = useRef<ProgressCache | null>(null);

	const applyCache = useCallback((cache: ProgressCache): void => {
		setProgressPercentage(cache.progressPercentage);
		setTasks(cache.tasks);
		setLastUpdatedAt(cache.lastUpdatedAt);
	}, []);

	// Flush pending cache writes to localStorage (debounced)
	const flushCacheWrite = useCallback((): void => {
		if (pendingCache.current) {
			writeProgressCache(pendingCache.current);
			broadcastProgressUpdate();
			pendingCache.current = null;
		}
		cacheWriteTimeout.current = null;
	}, []);

	// Queue a cache write with debouncing (1000ms)
	const queueCacheWrite = useCallback(
		(cache: ProgressCache): void => {
			pendingCache.current = cache;
			if (cacheWriteTimeout.current) {
				clearTimeout(cacheWriteTimeout.current);
			}
			cacheWriteTimeout.current = setTimeout(flushCacheWrite, 1000);
		},
		[flushCacheWrite],
	);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (cacheWriteTimeout.current) {
				clearTimeout(cacheWriteTimeout.current);
				flushCacheWrite();
			}
		};
	}, [flushCacheWrite]);

	useEffect(() => {
		const cache = readProgressCache();
		if (cache) applyCache(cache);
	}, [applyCache]);

	useEffect(() => {
		const handleProgressUpdate = () => {
			const cache = readProgressCache();
			if (cache) applyCache(cache);
		};

		window.addEventListener(PROGRESS_SYNC_EVENT, handleProgressUpdate);
		return () =>
			window.removeEventListener(
				PROGRESS_SYNC_EVENT,
				handleProgressUpdate,
			);
	}, [applyCache]);

	const refreshProgress = useCallback(
		async (userId: string | undefined): Promise<void> => {
			if (!userId) return;

			setIsLoading(true);
			try {
				const fetched = await fetchTasks(userId);
				if (!fetched) return;

				const progress = calculateProgress(fetched);
				const updatedAt = Date.now();

				setTasks(fetched);
				setProgressPercentage(progress);
				setLastUpdatedAt(updatedAt);
				queueCacheWrite({
					progressPercentage: progress,
					tasks: fetched,
					lastUpdatedAt: updatedAt,
				});
			} catch (error) {
				console.error("Failed to refresh progress:", error as Error);
			} finally {
				setIsLoading(false);
			}
		},
		[queueCacheWrite],
	);

	const triggerProgressUpdate = useCallback((): void => {
		broadcastProgressUpdate();
	}, []);

	const value: TaskProgressContextType = {
		progressPercentage,
		tasks,
		isLoading,
		lastUpdatedAt,
		refreshProgress,
		triggerProgressUpdate,
	};

	return (
		<TaskProgressContext.Provider value={value}>
			{children}
		</TaskProgressContext.Provider>
	);
}

/**
 * Hook to access task progress context.
 * Must be used within a {@link TaskProgressProvider}.
 *
 * @returns {TaskProgressContextType} The current task progress context value
 * @throws {Error} If called outside of a TaskProgressProvider
 */
export function useTaskProgress(): TaskProgressContextType {
	const context = useContext(TaskProgressContext);
	if (context === undefined) {
		throw new Error(
			"useTaskProgress must be used within TaskProgressProvider",
		);
	}
	return context;
}
