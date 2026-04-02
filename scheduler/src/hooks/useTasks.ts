"use client";

/**
 * useTasks
 *
 * Composes useTaskApi, useTaskForm, and useTaskActions into a single
 * public API for task management. Consumers receive all task state
 * and action callbacks without needing to know how each concern is implemented.
 */

import { useState, useEffect, useCallback } from "react";
import { notifyTaskSaved } from "../lib/taskNotifications";

// Types

interface Recurrence {
  type: string;
  days?: string[];
  until?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  url?: string;
  subtasks?: string[] | string;
  duration?: number;
  priority?: "High" | "Medium" | "Low";
  examId?: string;
  bufferDays?: number;
  isRecurring?: boolean;
  recurrence?: Recurrence | null;
  status?: "todo" | "in-progress" | "completed";
  completed?: boolean;
}

interface TaskFormData {
  name: string;
  description: string;
  dueDate: string;
  url: string;
  subtasks: string;
  durationHours: string;
  durationMinutes: string;
  priority: "High" | "Medium" | "Low";
  examId: string;
  bufferDays: number;
  isRecurring: boolean;
  recurrence: Recurrence | null;
}

interface TaskPayload {
  title: string;
  description: string;
  dueDate: string | null;
  priority: string;
  duration: number;
  subtasks: string[];
  userId: string | undefined;
  examId: string | null;
  bufferDays: number;
  url: string | null;
  isRecurring: boolean;
  recurrence: Recurrence | null;
}

// Constants

const PROGRESS_SYNC_EVENT = "task-progress-updated";
const PRIORITY_MAP: Record<string, number> = { High: 3, Medium: 2, Low: 1 };

const EMPTY_FORM: TaskFormData = {
  name: "",
  description: "",
  dueDate: "",
  url: "",
  subtasks: "",
  durationHours: "0",
  durationMinutes: "0",
  priority: "Medium",
  examId: "none",
  bufferDays: 0,
  isRecurring: false,
  recurrence: null,
};

// Pure utilities

/**
 * Resolves the next task status in the toggle cycle.
 *
 * @param {"todo" | "in-progress" | "completed" | undefined} current - The current task status
 * @param {string | null} forced - An explicit status override, or null to cycle
 * @returns {string} The resolved next status
 */
function resolveNextStatus(current: Task["status"], forced: string | null): string {
  if (forced) return forced;
  if (current === "todo")        return "in-progress";
  if (current === "in-progress") return "todo";
  if (current === "completed")   return "in-progress";
  return "todo";
}

/**
 * Transforms raw form data into a task API payload.
 *
 * @param {TaskFormData} data - The form data to transform
 * @param {string | undefined} userId - The authenticated user's ID
 * @returns {TaskPayload} A payload ready to POST or PATCH to the tasks API
 */
function buildTaskPayload(data: TaskFormData, userId: string | undefined): TaskPayload {
  const totalMinutes =
    parseInt(data.durationHours || "0") * 60 +
    parseInt(data.durationMinutes || "0");

  const subtasks =
    typeof data.subtasks === "string"
      ? data.subtasks.split(",").map((s) => s.trim()).filter(Boolean)
      : data.subtasks || [];

  return {
    title: data.name,
    description: data.description || "",
    dueDate: data.dueDate || null,
    priority: data.priority || "Medium",
    duration: totalMinutes,
    subtasks,
    userId,
    examId: data.examId === "none" ? null : (data.examId || null),
    bufferDays: parseInt(String(data.bufferDays)) || 0,
    url: data.url || null,
    isRecurring: data.isRecurring || false,
    recurrence: data.recurrence || null,
  };
}

/**
 * Maps a task record into pre-filled form data for editing.
 *
 * @param {Task} task - The task to populate form fields from
 * @returns {TaskFormData} Form data initialised with the task's current values
 */
function taskToFormData(task: Task): TaskFormData {
  return {
    name: task.title || "",
    description: task.description || "",
    dueDate: task.dueDate
      ? new Date(task.dueDate).toISOString().split("T")[0]
      : "",
    url: task.url || "",
    subtasks: Array.isArray(task.subtasks)
      ? task.subtasks.join(", ")
      : (task.subtasks || ""),
    durationHours: Math.floor((task.duration || 0) / 60).toString(),
    durationMinutes: ((task.duration || 0) % 60).toString(),
    priority: task.priority || "Medium",
    examId: task.examId || "none",
    bufferDays: task.bufferDays ?? 0,
    isRecurring: task.isRecurring || false,
    recurrence: task.recurrence || null,
  };
}

// Sub-hooks

/**
 * Manages task fetch and CRUD API operations.
 *
 * @param {string | undefined} userId - The authenticated user's ID
 * @returns {{ tasks: Task[]; isLoading: boolean; fetchTasks: () => Promise<void>; createTask: (p: TaskPayload) => Promise<Task>; updateTask: (id: string, p: Partial<TaskPayload>) => Promise<void>; deleteTask: (id: string) => Promise<void> }}
 */
function useTaskApi(userId: string | undefined) {
  const [tasks, setTasks]       = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res  = await fetch(`/api/tasks?userId=${userId}`);
      if (!res.ok) { console.warn(`API /api/tasks responded with status ${res.status}`); return; }
      const text = await res.text();
      if (!text)  { console.warn("Empty response body from /api/tasks"); return; }
      try {
        const data = JSON.parse(text);
        if (data.tasks) setTasks(data.tasks);
      } catch (parseError) {
        console.error("Failed to parse JSON response from /api/tasks", parseError);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const createTask = async (payload: TaskPayload): Promise<Task> => {
    const res  = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Unknown error"); }
    const data = await res.json();
    if (!data.task?.id) throw new Error("Invalid response from server");
    setTasks((prev) => [data.task, ...prev]);
    return data.task;
  };

  const updateTask = async (taskId: string, payload: Partial<TaskPayload>): Promise<void> => {
    const res     = await fetch(`/api/tasks/${taskId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data    = await res.json();
    const updated = data.task || { ...tasks.find((t) => t.id === taskId), ...payload };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  return { tasks, setTasks, isLoading, fetchTasks, createTask, updateTask, deleteTask };
}

/**
 * Manages task form state and submission logic.
 *
 * @param {Task[]} tasks - The current task list, used to look up tasks for editing
 * @param {(p: TaskPayload) => Promise<Task>} createTask - API create callback
 * @param {(id: string, p: Partial<TaskPayload>) => Promise<void>} updateTask - API update callback
 * @param {string | undefined} userId - The authenticated user's ID
 * @returns Form state, handlers, and submission callback
 */
function useTaskForm(
  tasks: Task[],
  createTask: (p: TaskPayload) => Promise<Task>,
  updateTask: (id: string, p: Partial<TaskPayload>) => Promise<void>,
  userId: string | undefined,
) {
  const [isDialogOpen, setIsDialogOpen]   = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [formData, setFormData]           = useState<TaskFormData>(EMPTY_FORM);

  const handleFormChange = (updates: Partial<TaskFormData>) =>
    setFormData((prev) => ({ ...prev, ...updates }));

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingTaskId(null);
  };

  const handleEditTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    setEditingTaskId(taskId);
    setFormData(taskToFormData(task));
    setIsDialogOpen(true);
  };

  const handleSubmitTask = async (mergedData?: Partial<TaskFormData>): Promise<void> => {
    const data = { ...formData, ...mergedData };
    if (!data.name?.trim()) {
      window.alert("Please enter a task name.");
      return;
    }
    try {
      const payload = buildTaskPayload(data, userId);
      if (editingTaskId !== null) {
        await updateTask(editingTaskId, payload);
      } else {
        await createTask(payload);
      }
      await notifyTaskSaved(userId, payload.title, editingTaskId !== null);
      setIsDialogOpen(false);
      resetForm();
    } catch (err: any) {
      window.alert(`Failed to save task: ${err.message}`);
    }
  };

  return { isDialogOpen, setIsDialogOpen, editingTaskId, formData, handleFormChange, resetForm, handleEditTask, handleSubmitTask };
}

/**
 * Manages task status toggling, sorting, and view/delete UI state.
 *
 * @param {Task[]} tasks - The current task list
 * @param {React.Dispatch<React.SetStateAction<Task[]>>} setTasks - State setter for tasks
 * @param {(id: string, p: Partial<TaskPayload>) => Promise<void>} updateTask - API update callback
 * @param {(id: string) => Promise<void>} deleteTask - API delete callback
 * @returns Action callbacks and view/delete UI state
 */
function useTaskActions(
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  updateTask: (id: string, p: Partial<TaskPayload>) => Promise<void>,
  deleteTask: (id: string) => Promise<void>,
) {
  const [viewTask, setViewTask]         = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const toggleTaskStatus = async (taskId: string, forcedStatus: string | null = null): Promise<any> => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return null;
    const nextStatus = resolveNextStatus(task.status, forcedStatus);
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const data = await res.json();
    setTasks((prev) =>
      prev.map((t) => t.id === taskId ? { ...t, status: nextStatus as Task["status"], completed: nextStatus === "completed" } : t),
    );
    window.dispatchEvent(new Event(PROGRESS_SYNC_EVENT));
    return data.rewards ?? null;
  };

  const sortTasks = () =>
    setTasks((prev) => [...prev].sort((a, b) => (PRIORITY_MAP[b.priority ?? "Medium"] ?? 0) - (PRIORITY_MAP[a.priority ?? "Medium"] ?? 0)));

  const handleViewTask   = (task: Task)   => setViewTask(task);
  const handleDeleteTask = (taskId: string) => setTaskToDelete(taskId);

  const confirmDeleteTask = async (): Promise<void> => {
    if (!taskToDelete) return;
    try {
      await deleteTask(taskToDelete);
      setTaskToDelete(null);
    } catch {
      window.alert("Failed to delete task.");
    }
  };

  const cancelDelete = () => setTaskToDelete(null);

  return { viewTask, setViewTask, taskToDelete, toggleTaskStatus, sortTasks, handleViewTask, handleDeleteTask, confirmDeleteTask, cancelDelete };
}

// Public hook

/**
 * Composes useTaskApi, useTaskForm, and useTaskActions into a unified task management API.
 *
 * @param {string | undefined} userId - The authenticated user's ID
 * @returns {object} All task state, form state, and action callbacks
 */
export function useTasks(userId: string | undefined) {
  const api     = useTaskApi(userId);
  const form    = useTaskForm(api.tasks, api.createTask, api.updateTask, userId);
  const actions = useTaskActions(api.tasks, api.setTasks, api.updateTask, api.deleteTask);

  return {
    tasks:        api.tasks,
    isLoading:    api.isLoading,
    fetchTasks:   api.fetchTasks,
    createTask:   api.createTask,
    updateTask:   api.updateTask,
    deleteTask:   api.deleteTask,
    ...form,
    ...actions,
  };
}