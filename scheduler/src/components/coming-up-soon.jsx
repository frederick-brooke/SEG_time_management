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
import  TaskViewDialog  from "./tasks/TaskViewDialog";
import { DeleteTaskDialog } from "./tasks/DeleteTaskDialog";
import { useTasks } from "@/src/hooks/useTasks";
import { LunarCard } from "./ui/lunar-card";

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
        return "border-red-500/30 bg-red-500/10 text-red-400";
      case "Medium":
        return "border-amber-500/30 bg-amber-500/10 text-amber-400";
      case "Low":
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
      default:
        return "border-white/10 bg-white/5 text-white/50";
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
      <div className="flex flex-col h-full">
        <div className="flex flex-row items-center justify-between px-1 mb-6">
          <h2 className="text-xl font-black tracking-widest text-white uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
            Coming Up Soon
          </h2>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsDialogOpen(true)}
              className="text-[10px] font-black uppercase tracking-wider bg-blue-400 text-gray-950 px-3 py-1.5 rounded-lg hover:bg-blue-300 transition-colors shadow-[0_0_15px_rgba(90,165,250,0.4)]">
                New
            </button>
            <Calendar className="h-4 w-4 text-white/40" />
          </div>
        </div>

        <div className="overflow-y-auto pt-0 pb-6 px-2 custom-scrollbar transition-all" style={{ maxHeight: "350px" }}>
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
                  getPriorityStyle={getPriorityStyle}
                />
              ))}
            </div>
            )}
        </div>
      </div>

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
