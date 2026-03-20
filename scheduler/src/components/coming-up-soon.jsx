"use client";
import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { TaskCard } from "./tasks/TaskCard";
import { TaskFormDialog } from "./tasks/TaskFormDialog";
import { TaskViewDialog } from "./tasks/TaskViewDialog";
import { DeleteTaskDialog } from "./tasks/DeleteTaskDialog";
import { useTasks } from "@/src/hooks/useTasks";

/**
 * Dashboard component which filters and displays tasks due within the next 7 days.
 * Integrates task management tools and synchronises linked exam data across dialogs.
 * @param {string} userId The unique identifier for fetching user tasks.
 * @param {Array} exams Array of user-created exams to populate the link dropdown.
 * @returns {JSX.Element} The rendered 'Coming Up Soon' section.
 */
export function ComingUpSoon({ userId, exams = [] }) {
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

  /**
   * Logic to determine if a task is due within the next 7 days.
   * @param {Object} task The task record from the database.
   * @returns {boolean} Whether the task is due in the next 7 days or not.
   */
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
      <div className="flex flex-col h-full">
        <div className="flex flex-row items-center justify-between px-1 mb-6">
          <h2 className="text-xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
            Coming Up Soon
          </h2>

          <div className="flex items-center">
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
              showTrigger={true}
              exams={exams}
            />
          </div>
        </div>
        
        {/* Task list in a scrollable container */}
        <div className="overflow-y-auto pt-0 pb-6 px-2 custom-scrollbar transition-all" style={{ maxHeight: "350px" }}>
          {comingSoonTasks.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-8 italic font-medium">No tasks due soon</p>
          ) : (
            <div className="space-y-3">
              {comingSoonTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  exams={exams}
                  onToggle={toggleTaskStatus}
                  onView={handleViewTask}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
            )}
        </div>
      </div>

      {/* Shared dialogs */}
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
