"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import SearchTaskCard from "./search-task-card";
import { useTasks } from "@/src/hooks/useTasks";
import { TaskViewDialog } from "@/src/components/tasks/TaskViewDialog";

export default function SearchTasks({
  tasks,
  totalTasks,
  totalTaskPages,
  setIsTaskFilterOpen,
  selectedTask,
  setSelectedTask,
  filters,
  setFilters,
  resetFilters,
}) {
  const start = (filters.page - 1) * filters.limit + 1;
  const end   = Math.min(filters.page * filters.limit, totalTasks);

  const { data: session }              = useSession();
  const { handleEditTask, handleDeleteTask } = useTasks(session?.user?.id);

  return (
    <div className="p-6">
      <section className="mb-4 bg-white shadow rounded p-6 flex flex-col h-[700px]">
        <h2 className="text-2xl font-semibold mb-4">Search Tasks</h2>
        <p className="flex justify-center p-3">"{totalTasks || 0} Tasks Found"</p>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tasks.map((task) => (
              <SearchTaskCard
                key={task.id}
                task={task}
                onView={() => setSelectedTask(task)}
                onEdit={() => handleEditTask(task.id)}
                onDelete={() => handleDeleteTask(task.id)}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-center flex-shrink-0">
          {tasks.length !== 0 ? (
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{start}–{end}</span>{" "}
              of <span className="font-semibold text-gray-900">{totalTasks}</span> tasks
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-4">No tasks found.</p>
          )}
        </div>

        {totalTaskPages >= 1 && (
          <div className="flex items-center justify-between mt-4 border-t flex-shrink-0">
            <button
              disabled={filters.page === 1}
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {filters.page} of {totalTaskPages}</span>
            <button
              disabled={filters.page === totalTaskPages}
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </section>

      <TaskViewDialog
        task={selectedTask}
        isOpen={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
}