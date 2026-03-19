"use client";

import * as React from "react";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TaskColumn } from "./tasks/TaskColumn";
import { TaskFormDialog } from "./tasks/TaskFormDialog";
import { TaskViewDialog } from "./tasks/TaskViewDialog";
import { DeleteTaskDialog } from "./tasks/DeleteTaskDialog";
import { useTasks } from "@/hooks/useTasks";

interface ToDoListProps {
  userId: string;
  exams?: { id: string; title: string }[];
  filterExamId?: string | null;
}

export function ToDoList({
  userId,
  exams = [],
  filterExamId = null,
}: ToDoListProps) {
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
    fetchTasks,
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

  const [categories, setCategories] = React.useState<any[]>([]);
  const [events, setEvents] = React.useState<any[]>([]);

  React.useEffect(() => {
    // Fetch categories
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));

    // ── Fetch events WITHOUT triggering Google sync ──────────────────────────
    // The calendar/events GET route runs a Google sync on every request unless
    // we pass ?nosync=true or rely on the SYNC_INTERVAL guard.
    // We add a cache: "force-cache" hint so Next.js deduplicates the request,
    // and we don't pass force=true so the sync interval guard applies.
    fetch("/api/calendar/events", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setEvents(Array.isArray(d) ? d : []));
  }, []);

  // Re-fetch when EventForm creates linked tasks
  React.useEffect(() => {
    const handler = () => fetchTasks();
    window.addEventListener("tasks-updated", handler);
    return () => window.removeEventListener("tasks-updated", handler);
  }, [fetchTasks]);

  const [searchQuery, setSearchQuery] = React.useState("");

  const isOverdue = (task: any) => {
    if (!task.dueDate || task.status === "completed") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(task.dueDate) < today;
  };

  const examFilteredTasks = filterExamId
    ? tasks.filter((t: any) => t.examId === filterExamId)
    : tasks;

  const searchedTasks = examFilteredTasks.filter((t: any) =>
    (t.title || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const overdueTasks = searchedTasks.filter((t: any) => isOverdue(t));
  const todoTasks = searchedTasks.filter(
    (t: any) => (t.status || "todo") === "todo" && !isOverdue(t),
  );
  const inProgressTasks = searchedTasks.filter(
    (t: any) => (t.status || "todo") === "in-progress" && !isOverdue(t),
  );
  const completedTasks = searchedTasks.filter(
    (t: any) => (t.status || "todo") === "completed",
  );

  const totalTasks = examFilteredTasks.length;
  const completedCount = examFilteredTasks.filter(
    (t: any) => t.status === "completed",
  ).length;
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const editingTask = editingTaskId
    ? tasks.find((t: any) => t.id === editingTaskId)
    : null;
  const editingLinkedEvent = editingTask?.eventId
    ? events.find((e: any) => e.id === editingTask.eventId)
    : null;

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
      <CardHeader className="pb-0">
        <CardTitle className="">TO DO LIST</CardTitle>
        <CardDescription className="">Get ahead of your tasks!</CardDescription>

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
          <button
            onClick={sortTasks}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-gray-400 transition-all"
          >
            Sort
          </button>
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
            onDelete={
              editingTaskId
                ? () => {
                    handleDeleteTask(editingTaskId);
                    setIsDialogOpen(false);
                    resetForm();
                  }
                : undefined
            }
            exams={exams}
            showTrigger={true}
            linkedEventTitle={editingLinkedEvent?.title ?? null}
            relativeOffsetDays={editingTask?.relativeOffsetDays ?? null}
            scheduledRelativeTo={editingTask?.scheduledRelativeTo ?? null}
          />
        </CardAction>
      </CardHeader>

      {/* Search */}
      <div className="px-6 mb-6">
        <div className="mt-4">
          <input
            placeholder="Search tasks…"
            className="w-full max-w-sm p-2 text-sm border rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <CardContent className="px-4">
        {examFilteredTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>
              No tasks yet. Click &ldquo;New&rdquo; to create your first task!
            </p>
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
              categories={categories}
              events={events}
            />
            <TaskColumn
              title="In Progress"
              tasks={inProgressTasks}
              status="in-progress"
              onToggle={toggleTaskStatus}
              onView={handleViewTask}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              categories={categories}
              events={events}
            />
            <TaskColumn
              title="Completed"
              tasks={completedTasks}
              status="completed"
              onToggle={toggleTaskStatus}
              onView={handleViewTask}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              categories={categories}
              events={events}
            />
            <TaskColumn
              title="Overdue"
              tasks={overdueTasks}
              status="overdue"
              onToggle={toggleTaskStatus}
              onView={handleViewTask}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              categories={categories}
              events={events}
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
        onEdit={(taskId) => {
          setViewTask(null);
          handleEditTask(taskId);
        }}
        categories={categories}
        events={events}
      />
    </Card>
  );
}
