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

export function ToDoList({ userId, exams = [], filterExamId = null }) {
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
    sortTasks,
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

  const [searchQuery, setSearchQuery] = React.useState("");

  const isOverdue = (task) => {
    if (!task.dueDate || task.status === "completed") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    return dueDate < today;
  };

  const examFilteredTasks = filterExamId
    ? tasks.filter(t => t.examId === filterExamId)
    : tasks;

  const searchedTasks = examFilteredTasks.filter(t =>
    (t.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const overdueTasks = searchedTasks.filter((task) => isOverdue(task));
  const todoTasks = searchedTasks.filter(t => (t.status || "todo") === "todo" && !isOverdue(t));
  const inProgressTasks = searchedTasks.filter(t => (t.status || "todo") === "in-progress" && !isOverdue(t));
  const completedTasks = searchedTasks.filter(t => (t.status || "todo") === "completed");

  // Progress bar logic
  const totalTasks = examFilteredTasks.length;
  const completedCount = examFilteredTasks.filter(t => t.status === "completed").length;
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

              if (open && editingTaskId === null && filterExamId) {
                handleFormChange({ examId: filterExamId });
              }
            }}
            editingTaskId={editingTaskId}
            formData={formData}
            onFormChange={handleFormChange}
            onSubmit={handleSubmitTask}
            exams={exams}
          />
        </CardAction>
      </CardHeader>

      {/* Search Bar */}
      <div className="px-6 mb-6">
        <div className="mt-4">
            <input
              placeholder="Search Tasks"
              className="w-full max-w-sm p-2 text-sm border rounded-md bg-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
      </div>
      

      <CardContent className="px-4">
        {examFilteredTasks.length === 0 ? (
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
              onView={handleViewTask}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              getPriorityStyle={getPriorityStyle}
            />
            <TaskColumn
              title="In Progress"
              tasks={inProgressTasks}
              status="in-progress"
              onToggle={toggleTaskStatus}
              onView={handleViewTask}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              getPriorityStyle={getPriorityStyle}
            />
            <TaskColumn
              title="Completed"
              tasks={completedTasks}
              status="completed"
              onToggle={toggleTaskStatus}
              onView={handleViewTask}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              getPriorityStyle={getPriorityStyle}
            />
            <TaskColumn
              title="Overdue"
              tasks={overdueTasks}
              status="overdue"
              onToggle={toggleTaskStatus}
              onView={handleViewTask}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              getPriorityStyle={getPriorityStyle}
            />
          </div>
        )}
      </CardContent>

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
    </Card>
  );
}
