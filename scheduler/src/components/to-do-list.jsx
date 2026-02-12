"use client";

import * as React from "react";
import { Progress } from "components/ui/progress";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import { Button } from "components/ui/button";
import { TaskColumn } from "./tasks/TaskColumn";
import { TaskFormDialog } from "./tasks/TaskFormDialog";
import { TaskViewDialog } from "./tasks/TaskViewDialog";
import { DeleteTaskDialog } from "./tasks/DeleteTaskDialog";
import { useTasks } from "@/src/hooks/useTasks";

export function ToDoList({ userId }) {
  const {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    sortTasks,
  } = useTasks(userId);

  // Form state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingTaskId, setEditingTaskId] = React.useState(null);
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    dueDate: "",
    subtasks: "",
    durationHours: "0",
    durationMinutes: "0",
    priority: "Low",
  });

  // View/Delete state
  const [viewTask, setViewTask] = React.useState(null);
  const [taskToDelete, setTaskToDelete] = React.useState(null);

  // Helper functions
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200";
      case "Medium":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200";
      case "Low":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const isOverdue = (task) => {
    if (!task.dueDate || task.status === "completed") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    return dueDate < today;
  };

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
      });
      setIsDialogOpen(true);
    }
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

  // Filter tasks
  const overdueTasks = tasks.filter((task) => isOverdue(task));
  const todoTasks = tasks.filter(
    (task) => (task.status || "todo") === "todo" && !isOverdue(task),
  );
  const inProgressTasks = tasks.filter(
    (task) => (task.status || "todo") === "in-progress" && !isOverdue(task),
  );
  const completedTasks = tasks.filter(
    (task) => (task.status || "todo") === "completed",
  );

  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  if (isLoading) {
    return (
      <Card className="@container/card">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading tasks...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>TO DO LIST</CardTitle>
        <CardDescription>Get ahead of your tasks!</CardDescription>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Task Completion</span>
            <span className="font-medium text-foreground">
              {progressPercentage}%
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <CardAction className="flex gap-2">
          <Button onClick={sortTasks}>Sort</Button>
          <TaskFormDialog
            isOpen={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
            editingTaskId={editingTaskId}
            formData={formData}
            onFormChange={handleFormChange}
            onSubmit={handleSubmitTask}
          />
        </CardAction>
      </CardHeader>

      <CardContent className="px-4">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No tasks yet. Click "New" to create your first task!</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            <TaskColumn
              title="To Do"
              tasks={todoTasks}
              status="todo"
              onToggle={toggleTaskStatus}
              onView={setViewTask}
              onEdit={handleEditTask}
              onDelete={setTaskToDelete}
              getPriorityStyle={getPriorityStyle}
            />
            <TaskColumn
              title="In Progress"
              tasks={inProgressTasks}
              status="in-progress"
              onToggle={toggleTaskStatus}
              onView={setViewTask}
              onEdit={handleEditTask}
              onDelete={setTaskToDelete}
              getPriorityStyle={getPriorityStyle}
            />
            <TaskColumn
              title="Completed"
              tasks={completedTasks}
              status="completed"
              onToggle={toggleTaskStatus}
              onView={setViewTask}
              onEdit={handleEditTask}
              onDelete={setTaskToDelete}
              getPriorityStyle={getPriorityStyle}
            />
            <TaskColumn
              title="Overdue"
              tasks={overdueTasks}
              status="overdue"
              onToggle={toggleTaskStatus}
              onView={setViewTask}
              onEdit={handleEditTask}
              onDelete={setTaskToDelete}
              getPriorityStyle={getPriorityStyle}
            />
          </div>
        )}
      </CardContent>

      <DeleteTaskDialog
        isOpen={taskToDelete !== null}
        onConfirm={confirmDeleteTask}
        onCancel={() => setTaskToDelete(null)}
      />
      <TaskViewDialog
        task={viewTask}
        isOpen={viewTask !== null}
        onClose={() => setViewTask(null)}
        getPriorityStyle={getPriorityStyle}
      />
    </Card>
  );
}
