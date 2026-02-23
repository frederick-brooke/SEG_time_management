"use client";
import { ToDoList } from "@/src/components/to-do-list";
import { useSession } from "next-auth/react";

export default function TasksPage() {
  const { data: session, status } = useSession();

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect or show message if not authenticated
  if (!session || !session.user) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <p>Please log in to view your tasks.</p>
      </div>
    );
  }

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
      <ToDoList userId={session.user.id} />
    </div>
  );
}
