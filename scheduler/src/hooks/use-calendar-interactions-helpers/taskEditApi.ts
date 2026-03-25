/**
 * @file taskEditApi.ts
 *
 * Utility functions for patching tasks via the API.
 */

import type { TaskFormData } from "@/components/tasks/TaskForm";

function parseSubtasks(subtasks: TaskFormData["subtasks"]) {
  return typeof subtasks === "string"
    ? subtasks.split(",").map((s) => s.trim()).filter(Boolean)
    : subtasks || [];
}

export async function patchTask(taskId: string, data: TaskFormData) {
  const hours = parseInt(data.durationHours || "0");
  const mins = parseInt(data.durationMinutes || "0");
  return fetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: data.name, description: data.description,
      dueDate: data.dueDate || null, priority: data.priority,
      duration: hours * 60 + mins, subtasks: parseSubtasks(data.subtasks),
      bufferDays: data.bufferDays, examId: data.examId,
      isRecurring: data.isRecurring, recurrence: data.recurrence,
      url: data.url || null,
    }),
  });
}