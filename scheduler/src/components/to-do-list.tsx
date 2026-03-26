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
} from "components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskColumn } from "./tasks/TaskColumn";
import { TaskForm } from "./tasks/TaskForm";
import { TaskViewDialog } from "./tasks/TaskViewDialog";
import { DeleteTaskDialog } from "./tasks/DeleteTaskDialog";
import { useTasks } from "@/hooks/useTasks";
import { useTaskFilters } from "../hooks/useTaskFilters";
import { getPriorityStyle } from "../lib/priority";

interface ToDoListProps {
  userId: string;
  exams?: any[];
  filterExamId?: string | null;
  highlightId?: string | null;
}

/**
 * Task management board component.
 * Renders task columns by status, progress bar, search bar and task dialogs.
 * @param {string} userId The ID of the user whose tasks are to be displayed.
 * @param {any[]} exams List of exams to populate the task form exam drop down.
 * @param {string | null} filterExamId Optional exam ID to filter tasks by.
 * @param {string | null} highlightId Optional task ID to highlight on render.
 * @returns {JSX.Element} The rendered task board.
 */
export function ToDoList({ userId, exams = [], filterExamId = null, highlightId = null }) {
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

  const [searchQuery, setSearchQuery] = React.useState("");
  const { 
    examFilteredTasks, 
    todoTasks, 
    inProgressTasks, 
    completedTasks, 
    overdueTasks, 
    progressPercentage 
  } = useTaskFilters(tasks, filterExamId, searchQuery);
  
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
    <Card className="bg-transparent border-none shadow-none @container/card overflow-visible">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-5xl font-black tracking-tighter text-white uppercase">TO DO LIST</CardTitle>
        <CardDescription className="text-white/40 font-bold uppercase tracking-[0.3em] text-[12px] mt-2">Get ahead of your tasks!</CardDescription>

        {/* Progress Bar */}
        <div className="mt-8 max-w-md space-y-3">
          <div className="flex justify-between text-[14px] font-black uppercase tracking-[0.2em]">
            <span className="text-white/60">Task Completion</span>
            <span className="text-lg font-black text-cyan-400 drop-shadow-[0_0_10x_rgba(59,130,246,0.5)]">
              {progressPercentage}%
            </span>
          </div>

          <div className="relative">
            <style dangerouslySetInnerHTML={{ __html: `
            [data-progress-indicator] > div {
              background-color: #38bdf8 !important;
              box-shadow: none !important;
            }
          `}} />

          <Progress 
            data-progress-indicator
            value={progressPercentage} 
            className="h-3 bg-white/5 border border-white/10 rounded-full overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]" />
          </div>
        </div>

        <CardAction className="flex gap-3 mt-8">
          <Button onClick={sortTasks}
                  className="bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
          >
            Sort
          </Button>
          <TaskForm
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
      <div className="px-0 mb-10">
        <div className="mt-4">
            <input
              placeholder="Search Tasks"
              className="w-full max-w-sm p-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white placeholder:text-white/20 focus:ring-blue-500/40 transition-all backdrop-blur-md outline-none"
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
              highlightId={highlightId}
              status="todo"
              onToggle={toggleTaskStatus}
              onView={handleViewTask}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
            <TaskColumn
              title="In Progress"
              tasks={inProgressTasks}
              highlightId={highlightId}
              status="in-progress"
              onToggle={toggleTaskStatus}
              onView={handleViewTask}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
            <TaskColumn
              title="Completed"
              tasks={completedTasks}
              highlightId={highlightId}
              status="completed"
              onToggle={toggleTaskStatus}
              onView={handleViewTask}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
            <TaskColumn
              title="Overdue"
              tasks={overdueTasks}
              highlightId={highlightId}
              status="overdue"
              onToggle={toggleTaskStatus}
              onView={handleViewTask}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}              
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