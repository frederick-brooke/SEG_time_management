import { useState, useEffect } from "react";

export function useTasks(userId) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

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

  const toggleTaskStatus = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let nextStatus;
    if (task.status === "todo") nextStatus = "in-progress";
    else if (task.status === "in-progress") nextStatus = "completed";
    else if (task.status === "completed") nextStatus = "in-progress";

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

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    sortTasks,
  };
}
