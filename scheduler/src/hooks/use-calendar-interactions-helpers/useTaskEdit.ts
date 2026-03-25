/**
 * @file useTaskEdit.ts
 *
 * Hook for managing task edit form state and submission.
 */

import { useState, useCallback } from "react";
import { taskToFormData } from "@/lib/ui";
import { patchTask } from "./taskEditApi";
import type { TaskFormData } from "@/components/tasks/TaskForm";

const DEFAULT_FORM: TaskFormData = {
  name: "", description: "", dueDate: null, url: "", subtasks: "",
  durationHours: "0", durationMinutes: "0", examId: "none",
  priority: "Medium", bufferDays: 0, isRecurring: false, recurrence: null,
};

export function useTaskEdit(refreshTasks: (e?: any[]) => Promise<any>) {
  const [isTaskEditOpen, setIsTaskEditOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState<TaskFormData>(DEFAULT_FORM);

  const openTaskEdit = (task: any) => {
    setTaskFormData(taskToFormData(task));
    setIsTaskEditOpen(true);
  };

  const submitTaskEdit = useCallback(
    async (taskId: string, mergedData: TaskFormData) => {
      await patchTask(taskId, mergedData);
      setIsTaskEditOpen(false);
      refreshTasks();
    },
    [refreshTasks],
  );

  return { isTaskEditOpen, setIsTaskEditOpen, taskFormData, setTaskFormData, openTaskEdit, submitTaskEdit };
}