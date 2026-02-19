import { useState, useEffect } from "react";

export function useTasks(userId) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state for editing
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dueDate: "",
    subtasks: "",
    durationHours: "0",
    durationMinutes: "0",
    priority: "Low",
    examId: "none",
  });

  // View/Delete state
  const [viewTask, setViewTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, [userId]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/tasks?userId=${userId}`);
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createTask = async (taskData) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Unknown error");
    }

    const data = await res.json();
    if (data.task && data.task.id) {
      setTasks([...tasks, data.task]);
      return data.task;
    }
    throw new Error("Invalid response from server");
  };

  const updateTask = async (taskId, taskData) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, ...taskData } : task,
      ),
    );
  };

  const deleteTask = async (taskId) => {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    setTasks(tasks.filter((task) => task.id !== taskId));
  };

  const toggleTaskStatus = async (taskId, forcedStatus = null) => {
    const task = tasks.find((t) => t.id === taskId);
   
    if (!task) return;

    let nextStatus = forcedStatus;
    if (!nextStatus) {
      if (task.status === "todo") nextStatus = "in-progress";
      else if (task.status === "in-progress") nextStatus = "todo";
      else if (task.status === "completed") nextStatus = "in-progress";
    }

    await updateTask(taskId, { status: nextStatus });
  };

  const sortTasks = () => {
    const priorityMap = { High: 3, Medium: 2, Low: 1 };
    setTasks(
      [...tasks].sort(
        (a, b) => priorityMap[b.priority] - priorityMap[a.priority],
      ),
    );
  };

  // NEW: Shared handler functions
  const handleFormChange = (updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      dueDate: "",
      subtasks: "",
      durationHours: "0",
      durationMinutes: "0",
      priority: "Low",
      examId: "none",
    });
    setEditingTaskId(null);
  };

  const handleSubmitTask = async () => {
    if (!formData.name.trim()) {
      alert("Please enter a task name.");
      return;
    }

    const totalMinutes =
      parseInt(formData.durationHours) * 60 +
      parseInt(formData.durationMinutes);
    const subtasksArray = formData.subtasks
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");

    const taskData = {
      title: formData.name,
      description: formData.description,
      dueDate: formData.dueDate || new Date().toISOString(),
      priority: formData.priority,
      duration: totalMinutes,
      subtasks: subtasksArray,
      userId: userId,
      examId: formData.examId === "none" ? null : formData.examId,
    };

    try {
      if (editingTaskId !== null) {
        await updateTask(editingTaskId, taskData);
      } else {
        await createTask(taskData);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      alert(`Failed to save task: ${error.message}`);
    }
  };

  const handleEditTask = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setEditingTaskId(taskId);
      setFormData({
        name: task.title,
        description: task.description,
        dueDate: task.dueDate || "",
        subtasks: task.subtasks?.join(", ") || "",
        durationHours: Math.floor((task.duration || 0) / 60).toString(),
        durationMinutes: ((task.duration || 0) % 60).toString(),
        priority: task.priority,
        examId: task.examId || "none",
      });
      setIsDialogOpen(true);
    }
  };

  const handleViewTask = (task) => {
    setViewTask(task);
  };

  const handleDeleteTask = (taskId) => {
    setTaskToDelete(taskId);
  };

  const confirmDeleteTask = async () => {
    if (taskToDelete) {
      try {
        await deleteTask(taskToDelete);
        setTaskToDelete(null);
      } catch (error) {
        alert("Failed to delete task.");
      }
    }
  };

  const cancelDelete = () => {
    setTaskToDelete(null);
  };

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
