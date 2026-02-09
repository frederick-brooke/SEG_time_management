"use client";

import { ToDoList } from "@/src/components/to-do-list";

export default function TasksPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <p className="text-muted-foreground">
          Manage your tasks and track your progress
        </p>
      </div>

      {/* To-Do List Component */}
      <ToDoList />
    </div>
  );
}
