"use client";
// src/hooks/useCalendarInteractions.ts
// ---------------------------------------------------------------------------
// Owns undo, search, event/task delete, and task edit submit logic.
// Keeps CalendarView free of these implementation details.
// ---------------------------------------------------------------------------
import { useState, useRef, useCallback } from "react";
import { taskToFormData } from "@/lib/ui";
import type { TaskFormData } from "@/components/tasks/TaskForm";

export function useCalendarInteractions(
  events: any[],
  refreshEvents: () => Promise<any[]>,
  refreshTasks: (e?: any[]) => Promise<any>,
) {
  // ── Undo ──────────────────────────────────────────────────────────────────
  const [lastDeleted, setLastDeleted] = useState<any | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const undoTimer = useRef<NodeJS.Timeout | null>(null);

  const triggerUndo = (event: any) => {
    setLastDeleted(event);
    setShowUndo(true);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setShowUndo(false), 8000);
  };

  const handleUndo = async () => {
    if (!lastDeleted) return;
    await fetch("/api/calendar/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: lastDeleted.title,
        description: lastDeleted.description,
        start: lastDeleted.start.toISOString(),
        end: lastDeleted.end.toISOString(),
        allDay: lastDeleted.allDay,
        category: lastDeleted.category,
        recurrenceType: lastDeleted.recurrence?.type || "none",
        recurrenceDays: lastDeleted.recurrence?.days,
        recurrenceUntil: lastDeleted.recurrence?.until,
      }),
    });
    setShowUndo(false);
    setLastDeleted(null);
    refreshEvents();
  };

  // ── Search ────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    setShowSearchResults(true);
    const res = await fetch(
      `/api/calendar/events?q=${encodeURIComponent(query)}`,
    );
    const data = await res.json();
    setSearchResults(
      data.map((e: any) => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
      })),
    );
  }, []);

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // ── Event delete ──────────────────────────────────────────────────────────
  const deleteEvent = useCallback(
    async (selectedEvent: any, mode: "single" | "series") => {
      const { id } = selectedEvent;
      if (!id || !/^[a-f\d]{24}$/i.test(id)) {
        alert(`Invalid event ID: "${id}".`);
        return false;
      }
      const msg =
        mode === "single"
          ? "Remove only this specific occurrence?"
          : "Delete the entire recurring series?";
      if (!confirm(msg)) return false;
      const instanceDate = (
        selectedEvent.start instanceof Date
          ? selectedEvent.start
          : new Date(selectedEvent.start)
      ).toISOString();
      const params = new URLSearchParams({ id, mode });
      if (mode === "single") params.append("date", instanceDate);
      const res = await fetch(`/api/calendar/events?${params}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        alert((await res.json()).message);
        return false;
      }
      triggerUndo(selectedEvent);
      refreshEvents();
      return true;
    },
    [refreshEvents],
  );

  // ── Task delete ───────────────────────────────────────────────────────────
  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!confirm("Delete this task?")) return false;
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      refreshTasks();
      return true;
    },
    [refreshTasks],
  );

  // ── Task edit form ────────────────────────────────────────────────────────
  const [isTaskEditOpen, setIsTaskEditOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState<TaskFormData>({
    name: "",
    description: "",
    dueDate: null,
    url: "",
    subtasks: "",
    durationHours: "0",
    durationMinutes: "0",
    examId: "none",
    priority: "Medium",
    bufferDays: 0,
    isRecurring: false,
    recurrence: null,
  });

  const openTaskEdit = (task: any) => {
    setTaskFormData(taskToFormData(task));
    setIsTaskEditOpen(true);
  };

  const submitTaskEdit = useCallback(
    async (taskId: string, mergedData: TaskFormData) => {
      const hours = parseInt(mergedData.durationHours || "0");
      const mins = parseInt(mergedData.durationMinutes || "0");
      const subtasks =
        typeof mergedData.subtasks === "string"
          ? mergedData.subtasks
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : mergedData.subtasks || [];
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: mergedData.name,
          description: mergedData.description,
          dueDate: mergedData.dueDate || null,
          priority: mergedData.priority,
          duration: hours * 60 + mins,
          subtasks,
          bufferDays: mergedData.bufferDays,
          examId: mergedData.examId,
          isRecurring: mergedData.isRecurring,
          recurrence: mergedData.recurrence,
          url: mergedData.url || null,
        }),
      });
      setIsTaskEditOpen(false);
      refreshTasks();
    },
    [refreshTasks],
  );

  return {
    // undo
    showUndo,
    handleUndo,
    dismissUndo: () => setShowUndo(false),
    // search
    searchQuery,
    searchResults,
    showSearchResults,
    handleSearch,
    clearSearch,
    showSearchResultsFor: () => searchQuery && setShowSearchResults(true),
    // delete
    deleteEvent,
    deleteTask,
    // task edit
    isTaskEditOpen,
    setIsTaskEditOpen,
    taskFormData,
    setTaskFormData,
    openTaskEdit,
    submitTaskEdit,
  };
}
