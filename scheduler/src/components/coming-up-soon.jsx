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

  const isComingSoon = (task) => {
    if (!task.dueDate || task.status === "completed") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    const due = new Date(task.dueDate);
    return due >= today && due <= sevenDaysFromNow;
  };

  const comingSoonTasks = tasks
    .filter(isComingSoon)
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
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
      />
    </>
  );
}
