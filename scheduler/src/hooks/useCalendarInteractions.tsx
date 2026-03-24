"use client";
// src/hooks/useCalendarInteractions.ts
// ---------------------------------------------------------------------------
// Composes single-responsibility hooks for CalendarView interactions.
// Meets Band V standards: High cohesion, strictly DRY, nesting depth <= 1.
// ---------------------------------------------------------------------------
import { useState, useRef, useCallback } from "react";
import { taskToFormData } from "@/lib/ui";
import type { TaskFormData } from "@/components/tasks/TaskForm";

// ── 1. Pure Helpers & API Client ──────────────────────────────────────────

/**
 * A strictly DRY wrapper for the Fetch API to handle boilerplate configuration.
 * * @param {string} endpoint - The relative or absolute URL for the API route.
 * @param {string} method - The HTTP method (e.g., "GET", "POST", "PATCH", "DELETE").
 * @param {any} [body] - Optional payload to be stringified and sent in the request body.
 * @returns {Promise<any>} The parsed JSON response.
 * @throws {Error} If the network response is not OK, throws the API's error message.
 */
const apiRequest = async (endpoint: string, method: string, body?: any) => {
  const options: RequestInit = { method };
  if (body) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }
  const res = await fetch(endpoint, options);
  if (!res.ok) throw new Error((await res.json()).message || "API Error");
  return res.json().catch(() => ({})); 
};

/**
 * Transforms a calendar event object into the payload expected by the undo endpoint.
 * * @param {any} event - The previously deleted event object.
 * @returns {Object} A formatted payload ready for the POST request.
 */
const buildUndoPayload = (event: any) => ({
  title: event.title, description: event.description,
  start: event.start.toISOString(), end: event.end.toISOString(),
  allDay: event.allDay, category: event.category,
  recurrenceType: event.recurrence?.type || "none",
  recurrenceDays: event.recurrence?.days, recurrenceUntil: event.recurrence?.until,
});

/**
 * Formats raw task form data into the structured payload required by the backend.
 * * @param {TaskFormData} data - The raw data submitted from the task edit form.
 * @returns {Object} A formatted payload with calculated durations and parsed subtasks.
 */
const formatTaskPayload = (data: TaskFormData) => ({
  title: data.name, description: data.description, dueDate: data.dueDate || null,
  priority: data.priority, bufferDays: data.bufferDays, examId: data.examId,
  isRecurring: data.isRecurring, recurrence: data.recurrence, url: data.url || null,
  duration: parseInt(data.durationHours || "0") * 60 + parseInt(data.durationMinutes || "0"),
  subtasks: typeof data.subtasks === "string" 
    ? data.subtasks.split(",").map((s) => s.trim()).filter(Boolean) 
    : data.subtasks || [],
});

// ── 2. Highly Cohesive Sub-Hooks ──────────────────────────────────────────

/**
 * Manages the state and network requests for undoing an event deletion.
 * * @param {Function} refreshEvents - Callback to refetch calendar events after a successful undo.
 * @returns {Object} Undo state flags and control functions (trigger, handle, dismiss).
 */
function useUndoManager(refreshEvents: () => Promise<any[]>) {
  const [lastDeleted, setLastDeleted] = useState<any | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoTimer = useRef<NodeJS.Timeout | null>(null);

  const triggerUndo = useCallback((event: any) => {
    setLastDeleted(event);
    setShowUndo(true);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setShowUndo(false), 8000);
  }, []);

  const handleUndo = useCallback(async () => {
    if (!lastDeleted) return;
    await apiRequest("/api/calendar/events", "POST", buildUndoPayload(lastDeleted));
    setShowUndo(false);
    setLastDeleted(null);
    refreshEvents();
  }, [lastDeleted, refreshEvents]);

  return { showUndo, handleUndo, dismissUndo: () => setShowUndo(false), triggerUndo };
}

/**
 * Manages the state and network requests for querying calendar events.
 * * @returns {Object} Search query state, results array, visibility flags, and handlers.
 */
function useSearchManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) return clearSearch();

    setShowSearchResults(true);
    const data = await apiRequest(`/api/calendar/events?q=${encodeURIComponent(query)}`, "GET");
    setSearchResults(data.map((e: any) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })));
  }, [clearSearch]);

  return { searchQuery, searchResults, showSearchResults, handleSearch, clearSearch, showSearchResultsFor: () => searchQuery && setShowSearchResults(true) };
}

/**
 * Manages the deletion of calendar events, including occurrences vs. entire series.
 * * @param {Function} refreshEvents - Callback to refetch events after deletion.
 * @param {Function} triggerUndo - Callback to prime the undo manager with the deleted event.
 * @returns {Object} Functions to handle event deletion.
 */
function useEventManager(refreshEvents: () => Promise<any[]>, triggerUndo: (e: any) => void) {
  const deleteEvent = useCallback(async (event: any, mode: "single" | "series") => {
    if (!/^[a-f\d]{24}$/i.test(event.id)) return alert(`Invalid event ID: "${event.id}".`), false;
    
    const msg = mode === "single" ? "Remove specific occurrence?" : "Delete entire series?";
    if (!confirm(msg)) return false;

    const params = new URLSearchParams({ id: event.id, mode });
    if (mode === "single") params.append("date", new Date(event.start).toISOString());

    try {
      await apiRequest(`/api/calendar/events?${params}`, "DELETE");
      triggerUndo(event);
      refreshEvents();
      return true;
    } catch (err: any) {
      return alert(err.message), false;
    }
  }, [refreshEvents, triggerUndo]);

  return { deleteEvent };
}

/**
 * Manages the state, deletion, and editing workflows for tasks.
 * * @param {Function} refreshTasks - Callback to refetch tasks after a mutation.
 * @returns {Object} Task form state, visibility flags, and mutation handlers.
 */
function useTaskManager(refreshTasks: () => Promise<any>) {
  const [isTaskEditOpen, setIsTaskEditOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState<TaskFormData>({} as TaskFormData); 

  const deleteTask = useCallback(async (taskId: string) => {
    if (!confirm("Delete this task?")) return false;
    await apiRequest(`/api/tasks/${taskId}`, "DELETE");
    refreshTasks();
    return true;
  }, [refreshTasks]);

  const openTaskEdit = useCallback((task: any) => {
    setTaskFormData(taskToFormData(task));
    setIsTaskEditOpen(true);
  }, []);

  const submitTaskEdit = useCallback(async (taskId: string, data: TaskFormData) => {
    await apiRequest(`/api/tasks/${taskId}`, "PATCH", formatTaskPayload(data));
    setIsTaskEditOpen(false);
    refreshTasks();
  }, [refreshTasks]);

  return { deleteTask, isTaskEditOpen, setIsTaskEditOpen, taskFormData, setTaskFormData, openTaskEdit, submitTaskEdit };
}

// ── 3. Facade Hook ────────────────────────────────────────────────────────

/**
 * Facade hook that orchestrates search, undo, event, and task interactions.
 * Keeps the UI components decoupled from the underlying network and state logic.
 * * @param {any[]} events - The current array of calendar events.
 * @param {Function} refreshEvents - Function to trigger a refetch of calendar events.
 * @param {Function} refreshTasks - Function to trigger a refetch of user tasks.
 * @returns {Object} A combined object containing all interaction methods and states needed by the view.
 */
export function useCalendarInteractions(
  events: any[],
  refreshEvents: () => Promise<any[]>,
  refreshTasks: (e?: any[]) => Promise<any>,
) {
  const undo = useUndoManager(refreshEvents);
  const search = useSearchManager();
  const eventsMgr = useEventManager(refreshEvents, undo.triggerUndo);
  const tasksMgr = useTaskManager(refreshTasks);

  return {
    ...undo,
    ...search,
    ...eventsMgr,
    ...tasksMgr,
  };
}