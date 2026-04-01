"use client";

/**
 * TaskProgressContext
 *
 * Global state for task progress tracking, including cached progress,
 * API syncing, and cross-tab updates via events and localStorage.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

interface TaskProgressContextType {
  progressPercentage: number;
  tasks: any[];
  isLoading: boolean;
  lastUpdatedAt: number | null;
  refreshProgress: (userId: string | undefined) => Promise<void>;
  triggerProgressUpdate: () => void;
}

const TaskProgressContext = createContext<TaskProgressContextType | undefined>(undefined);

const PROGRESS_SYNC_EVENT = "task-progress-updated";
const PROGRESS_STORAGE_KEY = "task-progress-cache";

export function TaskProgressProvider({ children }: { children: React.ReactNode }) {
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  // Load cached progress on mount
  useEffect(() => {
    const cached = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (cached) {
      try {
        const { progressPercentage: cachedProgress, tasks: cachedTasks, lastUpdatedAt: cachedTime } = JSON.parse(cached);
        setProgressPercentage(cachedProgress);
        setTasks(cachedTasks);
        setLastUpdatedAt(cachedTime);
      } catch (e) {
        console.error("Failed to load cached progress:", e);
      }
    }
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({
      progressPercentage,
      tasks,
      lastUpdatedAt,
    }));
  }, [progressPercentage, tasks, lastUpdatedAt]);

  // Listen for progress updates from other components or tabs
  useEffect(() => {
    const handleProgressUpdate = () => {
      const cached = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (cached) {
        try {
          const { progressPercentage: newProgress, tasks: newTasks, lastUpdatedAt: newTime } = JSON.parse(cached);
          setProgressPercentage(newProgress);
          setTasks(newTasks);
          setLastUpdatedAt(newTime);
        } catch (e) {
          console.error("Failed to sync progress update:", e);
        }
      }
    };

    window.addEventListener(PROGRESS_SYNC_EVENT, handleProgressUpdate);
    return () => window.removeEventListener(PROGRESS_SYNC_EVENT, handleProgressUpdate);
  }, []);

  const refreshProgress = useCallback(async (userId: string | undefined) => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/tasks?userId=${userId}`);

      // Check response status
      if (!res.ok) {
        console.warn(`API /api/tasks responded with status ${res.status}`);
        return;
      }

      // Get response text first to avoid JSON parse errors
      const text = await res.text();
      if (!text) {
        console.warn("Empty response body from /api/tasks");
        return;
      }

      // Parse JSON safely
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Failed to parse JSON response from /api/tasks", parseError);
        return;
      }

      const tasksArray = Array.isArray(data) ? data : (data.tasks || []);
      if (tasksArray) {
        const totalTasks = tasksArray.length;
        const completedTasks = tasksArray.filter((t: any) => t.status === "completed" || t.isCompleted === true).length;
        const newProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        setTasks(tasksArray);
        setProgressPercentage(newProgress);
        setLastUpdatedAt(Date.now());

        // Broadcast update to other components/tabs
        window.dispatchEvent(new Event(PROGRESS_SYNC_EVENT));
      }
    } catch (error) {
      console.error("Failed to refresh progress:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const triggerProgressUpdate = useCallback(() => {
    window.dispatchEvent(new Event(PROGRESS_SYNC_EVENT));
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
 * Hook to access task progress context
 */
export function useTaskProgress() {
  const context = useContext(TaskProgressContext);
  if (context === undefined) {
    throw new Error("useTaskProgress must be used within TaskProgressProvider");
  }
  return context;
}
