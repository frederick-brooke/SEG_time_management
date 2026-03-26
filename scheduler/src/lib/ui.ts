// src/lib/ui.ts
// ---------------------------------------------------------------------------
// Shared UI constants and pure helpers used across components.
// Import from here — never re-declare inline.
// ---------------------------------------------------------------------------

// ── Priority ──────

export const PRIORITY_BADGE: Record<string, string> = {
  High: "bg-red-100 text-red-600 border-red-200",
  Medium: "bg-orange-100 text-orange-600 border-orange-200",
  Low: "bg-green-100 text-green-600 border-green-200",
};

export const PRIORITY_TEXT: Record<string, string> = {
  High: "text-red-500",
  Medium: "text-orange-500",
  Low: "text-green-500",
};

export const PRIORITY_SCORE: Record<string, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

// ── Category colours ───────

export const CATEGORY_COLORS: Record<string, string> = {
  Lecture: "#6366f1",
  "Individual Study": "#10b981",
  Exam: "#ef4444",
  Personal: "#f59e0b",
  Lab: "#8b5cf6",
  Google: "#4285F4",
};

export const TASK_COLORS: Record<string, string> = {
  High: "#dc2626",
  Medium: "#ea580c",
  Low: "#16a34a",
};

// ── Due-date helpers ───────

/** Returns days until due date (negative = overdue). */
export function daysUntil(dueDate: string | Date): number {
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86_400_000);
}

/** Returns true if the task is overdue and not completed. */
export function isTaskOverdue(task: {
  dueDate?: string | null;
  status?: string;
  completed?: boolean;
}): boolean {
  if (!task.dueDate) return false;
  if (task.status === "completed" || task.completed) return false;
  return daysUntil(task.dueDate) < 0;
}

// ── Duration formatting ─────

/** Formats a duration in minutes to a human-readable string, e.g. "1h 30m". */
export function formatDuration(mins: number): string {
  if (mins <= 0) return "0m";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Task form data helpers ─

/** Converts a raw task DB record into TaskFormData shape. */
export function taskToFormData(task: any) {
  const totalMins = task.duration || 0;
  return {
    name: task.title || "",
    description: task.description || "",
    dueDate: task.dueDate || null,
    url: task.url || "",
    subtasks: Array.isArray(task.subtasks)
      ? task.subtasks.join(", ")
      : task.subtasks || "",
    durationHours: Math.floor(totalMins / 60).toString(),
    durationMinutes: (totalMins % 60).toString(),
    examId: task.examId || "none",
    priority: task.priority || "Medium",
    bufferDays: task.bufferDays ?? 0,
    isRecurring: task.isRecurring || false,
    recurrence: task.recurrence || null,
  };
}

// ── Subtask normalisation ──

/** Always returns subtasks as a string array regardless of storage format. */
export function normaliseSubtasks(subtasks: any): string[] {
  if (!subtasks) return [];
  if (Array.isArray(subtasks)) return subtasks.map(String);
  return String(subtasks)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ── Relative offset label ──

/** Returns a human-readable label for a relative offset, e.g. "2 days before event". */
export function relativeOffsetLabel(
  days: number | null | undefined,
): string | null {
  if (days == null) return null;
  if (days === 0) return "same day as event";
  if (days < 0)
    return `${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} before event`;
  return `${days} day${days !== 1 ? "s" : ""} after event`;
}
