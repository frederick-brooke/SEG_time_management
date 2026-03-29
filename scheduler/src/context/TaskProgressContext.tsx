"use client";

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
    if (tasks.length > 0 || progressPercentage > 0) {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({
        progressPercentage,
        tasks,
        lastUpdatedAt,
      }));
    }
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
      const data = await res.json();

      if (data.tasks) {
        const tasksArray = data.tasks;
        const totalTasks = tasksArray.length || 0;
        const completedTasks = tasksArray.filter((t: any) => t.status === "completed").length;
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
