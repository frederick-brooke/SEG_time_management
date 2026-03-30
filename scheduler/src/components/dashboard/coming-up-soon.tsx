"use client";

import * as React from "react";
import { TaskCard } from "../tasks/TaskCard";
import { TaskForm } from "../tasks/TaskForm";
import { TaskViewDialog } from "../tasks/TaskViewDialog";
import { DeleteTaskDialog } from "../tasks/DeleteTaskDialog";
import { useTasks } from "@/hooks/useTasks";
import { getPriorityStyle } from "@/lib/priority";

/**
 * Component props for ComingUpSoon.
 */
interface ComingUpSoonProps {
  userId?: string;
  exams?: any[];
}

interface Task {
  id: string;
  title: string;
  dueDate: string | Date;
  status: string;
  [key: string]: any;
}

/**
 * Evaluates if a task is incomplete and due within the next 7 days.
 * @param {Task} task - The task record to evaluate.
 * @returns {boolean} True if due within 7 days.
 */
function isTaskComingSoon(task: Task): boolean {
  if (!task.dueDate || task.status === "completed") return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);
  
  const due = new Date(task.dueDate as string);
  return due >= today && due <= sevenDaysFromNow;
}

/**
 * Filters and sorts tasks to return only those coming up soon.
 * @param {Task[]} tasks - The full list of tasks.
 * @returns {Task[]} Sorted array of upcoming tasks.
 */
function getSortedComingSoonTasks(tasks: Task[]): Task[] {
  return tasks
    .filter(isTaskComingSoon)
    .sort((a, b) => new Date(a.dueDate as string).getTime() - new Date(b.dueDate as string).getTime());
}

/**
 * Dashboard component displaying tasks due within the next 7 days.
 * Integrates task management tools and synchronises linked exam data.
 *
 * @param {ComingUpSoonProps} props - Component properties.
 * @returns {JSX.Element} The rendered dashboard section.
 */
export function ComingUpSoon({ userId, exams = [] }: ComingUpSoonProps) {
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

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading...</div>;
  }

  const comingSoonTasks = getSortedComingSoonTasks(tasks);

  return (
    <>
      <div className="flex flex-col h-full">
        
        <header className="flex flex-row items-center justify-between px-1 mb-6">
          <h2 className="text-xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
            Coming Up Soon
          </h2>
          <TaskForm
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
        </header>
        
        <div className="lunar-scroll-area pt-0 pb-6 px-2 transition-all" style={{ maxHeight: "350px" }}>
          {comingSoonTasks.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-8 italic font-medium">No tasks due soon</p>
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
        </div>
      </div>

      <DeleteTaskDialog
        isOpen={!!taskToDelete}
        onConfirm={confirmDeleteTask}
        onCancel={cancelDelete}
      />

      <TaskViewDialog
        task={viewTask}
        isOpen={viewTask !== null}
        onClose={() => setViewTask(null)}
        onEdit={(taskId) => {
          setViewTask(null);
          handleEditTask(taskId);
        }}
        getPriorityStyle={getPriorityStyle}
      />
    </>
  );
}