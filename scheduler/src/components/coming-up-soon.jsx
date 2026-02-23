"use client";
import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Calendar } from "lucide-react";
import { TaskCard } from "./tasks/TaskCard";
import { TaskFormDialog } from "./tasks/TaskFormDialog";
import { TaskViewDialog } from "./tasks/TaskViewDialog";
import { DeleteTaskDialog } from "./tasks/DeleteTaskDialog";
import { useTasks } from "@/src/hooks/useTasks";

export function ComingUpSoon({ userId }) {
  const {
    tasks,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    editingTaskId,
    formData,
    viewTask,
    setViewTask,
    taskToDelete,
    toggleTaskStatus,
    handleFormChange,
    resetForm,
    handleSubmitTask,
    handleEditTask,
    handleViewTask,
    handleDeleteTask,
    confirmDeleteTask,
    cancelDelete,
  } = useTasks(userId);

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

  const isComingSoon = (task) => {
    if (!task.dueDate) return false;
    if (task.status === "completed") return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    return dueDate >= today && dueDate <= sevenDaysFromNow;
  };

  const comingSoonTasks = tasks
    .filter((t) => isComingSoon(t))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">
            Coming Up Soon
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>

        <CardContent>
          {comingSoonTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks due soon</p>
          ) : (
            <div className="space-y-3">
              {comingSoonTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={toggleTaskStatus}
                  onView={handleViewTask}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                  getPriorityStyle={getPriorityStyle}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shared dialogs */}
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
      <DeleteTaskDialog
        isOpen={taskToDelete !== null}
        onConfirm={confirmDeleteTask}
        onCancel={cancelDelete}
      />
      <TaskViewDialog
        task={viewTask}
        isOpen={viewTask !== null}
        onClose={() => setViewTask(null)}
        getPriorityStyle={getPriorityStyle}
      />
    </>
  );
}
