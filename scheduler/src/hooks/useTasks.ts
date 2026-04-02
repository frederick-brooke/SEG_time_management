import { useState, useEffect, useCallback } from "react";
import { notifyTaskSaved } from "../lib/taskNotifications";

// Progress sync event - dispatched when task progress updates
const PROGRESS_SYNC_EVENT = "task-progress-updated";

export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [formData, setFormData] = useState({
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
  });

  // View/Delete state
  const [viewTask, setViewTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // useCallback so consumers can call fetchTasks() to force a refresh
  const fetchTasks = useCallback(async () => {
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

      if (data.tasks) setTasks(data.tasks);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (taskData) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Unknown error");
    }
    const data = await res.json();
    if (data.task?.id) {
      setTasks((prev) => [data.task, ...prev]);
      return data.task;
    }
    throw new Error("Invalid response from server");
  };

  const updateTask = async (taskId, taskData) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });
    const data = await res.json();
    const updated = data.task || { ...tasks.find((t) => t.id === taskId), ...taskData };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
  };

  const deleteTask = async (taskId) => {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const toggleTaskStatus = async (taskId, forcedStatus = null) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return null;

    let nextStatus = forcedStatus;
    if (!nextStatus) {
      if (task.status === "todo") nextStatus = "in-progress";
      else if (task.status === "in-progress") nextStatus = "todo";
      else if (task.status === "completed") nextStatus = "in-progress";
    }

    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    const data = await res.json();

    setTasks(prev => prev.map((t) => t.id === taskId ? { ...t, status: nextStatus, completed: nextStatus === "completed" } : t));

    // Trigger progress update when task status changes
    window.dispatchEvent(new Event(PROGRESS_SYNC_EVENT));

    return data.rewards ?? null;
  };

  const sortTasks = () => {
    const priorityMap = { High: 3, Medium: 2, Low: 1 };
    setTasks((prev) =>
      [...prev].sort((a, b) => priorityMap[b.priority] - priorityMap[a.priority]),
    );
  };

  const handleFormChange = (updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const resetForm = () => {
    setFormData({
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
    });
    setEditingTaskId(null);
  };

  const handleSubmitTask = async (mergedData) => {
    const data = mergedData || formData;
    if (!data.name?.trim()) {
      alert("Please enter a task name.");
      return;
    }

    const totalMinutes =
      parseInt(data.durationHours || "0") * 60 +
      parseInt(data.durationMinutes || "0");

    const subtasksArray =
      typeof data.subtasks === "string"
        ? data.subtasks.split(",").map((s) => s.trim()).filter(Boolean)
        : data.subtasks || [];

    const taskData = {
      title: data.name,
      description: data.description || "",
      // Don't force a dueDate if the user left it blank
      dueDate: data.dueDate || null,
      priority: data.priority || "Medium",
      duration: totalMinutes,
      subtasks: subtasksArray,
      userId,
      examId: data.examId === "none" ? null : (data.examId || null),
      bufferDays: parseInt(data.bufferDays) || 0,
      url: data.url || null,
      isRecurring: data.isRecurring || false,
      recurrence: data.recurrence || null,
    };

    try {
      if (editingTaskId !== null) {
        await updateTask(editingTaskId, taskData);
      } else {
        await createTask(taskData);
      }

      await notifyTaskSaved(userId, taskData.title, editingTaskId !== null);

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      alert(`Failed to save task: ${error.message}`);
    }
  };

  const handleEditTask = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    setEditingTaskId(taskId);
    setFormData({
      name: task.title || "",
      description: task.description || "",
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
      url: task.url || "",
      subtasks: Array.isArray(task.subtasks) ? task.subtasks.join(", ") : (task.subtasks || ""),
      durationHours: Math.floor((task.duration || 0) / 60).toString(),
      durationMinutes: ((task.duration || 0) % 60).toString(),
      priority: task.priority || "Medium",
      examId: task.examId || "none",
      bufferDays: task.bufferDays ?? 0,
      isRecurring: task.isRecurring || false,
      recurrence: task.recurrence || null,
    });
    setIsDialogOpen(true);
  };

  const handleViewTask = (task) => setViewTask(task);

  const handleDeleteTask = (taskId) => setTaskToDelete(taskId);

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await deleteTask(taskToDelete);
      setTaskToDelete(null);
    } catch {
      alert("Failed to delete task.");
    }
  };

  const cancelDelete = () => setTaskToDelete(null);

  return {
    // Data
    tasks,
    isLoading,

    // Form state
    isDialogOpen,
    setIsDialogOpen,
    editingTaskId,
    formData,

    // View/Delete state
    viewTask,
    setViewTask,
    taskToDelete,

    // Actions
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    sortTasks,

    // Handlers
    handleFormChange,
    resetForm,
    handleSubmitTask,
    handleEditTask,
    handleViewTask,
    handleDeleteTask,
    confirmDeleteTask,
    cancelDelete,
  };
}