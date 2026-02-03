"use client";

import * as React from "react";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "components/ui/alert-dialog";
import { Button } from "components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "components/ui/toggle-group";
import { Checkbox } from "components/ui/checkbox";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { $brand } from "zod";

export const description = "An interactive area chart";

// Main To-Do List Component
export function ToDoList() {
  // ==================== STATE MANAGEMENT ====================

  // Task data
  const [tasks, setTasks] = React.useState([]);

  // Create/Edit task form state
  const [newTaskName, setNewTaskName] = React.useState("");
  const [newTaskDescription, setNewTaskDescription] = React.useState("");
  const [newTaskPriority, setNewTaskPriority] = React.useState("!");
  const [newTaskDueDate, setNewTaskDueDate] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [newTaskSubtasks, setNewTaskSubtasks] = React.useState("");
  const [editingTaskId, setEditingTaskId] = React.useState(null); // null = create mode, number = edit mode

  // View task state
  const [viewTask, setViewTask] = React.useState(null);

  // Delete task state
  const [taskToDelete, setTaskToDelete] = React.useState(null);

  // ==================== HANDLER FUNCTIONS ====================

  // Handler: Create or update a task
  const handleSubmitTask = () => {
    // Validate that task name is not empty
    if (!newTaskName.trim()) {
      alert("Please enter a task name.");
      return;
    }

    if (editingTaskId !== null) {
      // EDIT MODE: Update existing task
      const updatedTasks = tasks.map((task) =>
        task.id === editingTaskId
          ? {
              ...task,
              name: newTaskName,
              description: newTaskDescription,
              subtasks: newTaskSubtasks
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s !== ""),
              priority:
                newTaskPriority === "Low"
                  ? "Low"
                  : newTaskPriority === "Medium"
                  ? "Medium"
                  : "High",
              dueDate: newTaskDueDate || null,
            }
          : task
      );
      setTasks(updatedTasks);
      setEditingTaskId(null);
    } else {
      // CREATE MODE: Add new task
      const newTask = {
        id: tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 1,
        name: newTaskName,
        priority:
          newTaskPriority === "Low"
            ? "Low"
            : newTaskPriority === "Medium"
            ? "Medium"
            : "High",
        description: newTaskDescription,
        status: "todo",
        subtasks: newTaskSubtasks
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s !== ""),
        dueDate: newTaskDueDate || null,
      };
      setTasks([...tasks, newTask]);
    }
    setNewTaskSubtasks("");

    // Reset form fields and close dialog
    setNewTaskName("");
    setNewTaskDescription("");
    setNewTaskPriority("Low");
    setNewTaskDueDate("");
    setIsDialogOpen(false);
  };

  // Handler: Open edit dialog with task data
  const handleEditTask = (taskId) => {
    const taskToEdit = tasks.find((task) => task.id === taskId);
    if (taskToEdit) {
      setEditingTaskId(taskId);
      setNewTaskName(taskToEdit.name);
      setNewTaskDescription(taskToEdit.description);
      setNewTaskSubtasks(taskToEdit.subtasks?.join(", " || ""));
      // Convert priority from words back to symbols
      setNewTaskPriority(
        taskToEdit.priority === "Low"
          ? "Low"
          : taskToEdit.priority === "Medium"
          ? "Medium"
          : "High"
      );
      setNewTaskDueDate(taskToEdit.dueDate || "");
      setIsDialogOpen(true);
    }
  };

  // Handler: View task details
  const handleViewTask = (task) => {
    setViewTask(task);
  };

  // Handler: Confirm and delete a task
  const confirmDeleteTask = () => {
    if (taskToDelete !== null) {
      const updatedTasks = tasks.filter((task) => task.id !== taskToDelete);
      setTasks(updatedTasks);
      setTaskToDelete(null);
    }
  };

  // Handler: Cancel delete action
  const cancelDelete = () => {
    setTaskToDelete(null);
  };

  // Handler: Toggle task completion
  const handleToggleComplete = (taskId) => {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        let nextStatus;
        if (task.status === "todo") {
          nextStatus = "in-progress";
        } else if (task.status === "in-progress") {
          nextStatus = "completed";
        } else if (task.status === "completed") {
          nextStatus = "in-progress";
        }
        return { ...task, status: nextStatus };
      }
      return task;
    });
    setTasks(updatedTasks);
  };

  // Handler: Sort tasks
  const handleSort = () => {
    const priorityMap = { High: 3, Medium: 2, Low: 1 };
    const sortedByPriority = [...tasks].sort((a, b) => {
      return priorityMap[b.priority] - priorityMap[a.priority];
    });
    setTasks(sortedByPriority);
  };
  // Helper: Check if a task is overdue
  const isOverdue = (task) => {
    if (!task.dueDate || task.status === "completed") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const dueDate = new Date(task.dueDate);
    return dueDate < today;
  };

  // Helper: Colour code priorities on tasks
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

  // Filter tasks by status and due date
  const overdueTasks = tasks.filter((task) => isOverdue(task));
  const todoTasks = tasks.filter(
    (task) => task.status === "todo" && !isOverdue(task)
  );
  const inProgressTasks = tasks.filter(
    (task) => task.status === "in-progress" && !isOverdue(task)
  );
  const completedTasks = tasks.filter((task) => task.status === "completed");

  // Render Task Columns
  const renderTaskColumn = (Title, taskList, status) => (
    <div
      className={`flex-1 min-w-[300px] rounded-lg border p-4 ${
        status === "overdue"
          ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
          : "bg-muted/20"
      }`}
    >
      {/* column header */}
      <div className="mb-4 pb-3 border-b">
        <h3 className="font-semibold text-base">{Title}</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {taskList.length} {taskList.list === 1 ? "task" : "tasks"}
        </p>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {taskList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No tasks
          </div>
        ) : (
          taskList.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 rounded-lg border p-2.5 bg-card shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Drag Handle */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-grab shrink-0"
              >
                <span className="text-muted-foreground text-sm">⋮⋮</span>
              </Button>

              {/* Checkbox */}
              <Checkbox
                id={`task-${task.id}`}
                checked={task.status === "completed"}
                onCheckedChange={() => handleToggleComplete(task.id)}
                className="shrink-0 h-4 w-4"
              />

              {/* Task info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-1">
                  <span
                    className={`text-sm font-medium truncate ${
                      task.status === "completed"
                        ? "line-through text-muted-foreground"
                        : ""
                    }`}
                  >
                    {task.name}
                  </span>
                  <span
                    className={
                      `text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${getPriorityStyle(task.priority)}`}
                  >
                    {task.priority}
                  </span>
                </div>
                {task.dueDate && (
                  <span className="text-xs text-muted-foreground">
                    Due:{" "}
                    {new Date(task.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleViewTask(task)}
                  title="View Task"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleEditTask(task.id)}
                  title="Edit Task"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setTaskToDelete(task.id)}
                  title="Delete Task"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // ==================== RENDER ====================

  return (
    <Card className="@container/card">
      {/* ========== CARD HEADER ========== */}
      <CardHeader>
        <CardTitle>TO DO LIST</CardTitle>
        <CardDescription>
          <span>Get ahead of your tasks!</span>
        </CardDescription>

        {/* Action Buttons */}
        <CardAction className="flex gap-2">
          <Button onClick={handleSort}>Sort</Button>

          {/* Create/Edit Task Dialog */}
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              // Reset form when dialog closes
              if (!open) {
                setEditingTaskId(null);
                setNewTaskName("");
                setNewTaskDescription("");
                setNewTaskPriority("!");
                setNewTaskDueDate("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>New</Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTaskId !== null ? "Edit Task" : "Create New Task"}
                </DialogTitle>
                <DialogDescription>
                  {editingTaskId !== null
                    ? "Update the task details below"
                    : "Add a new task to your list"}
                </DialogDescription>
              </DialogHeader>

              {/* Task Form */}
              <div className="grid gap-4 py-4">
                {/* Task Name */}
                <div className="grid gap-2">
                  <Label htmlFor="task-name">Task Name</Label>
                  <Input
                    id="task-name"
                    placeholder="Enter task name"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                  />
                </div>

                {/* Task Description */}
                <div className="grid gap-2">
                  <Label htmlFor="task-description">Task Description</Label>
                  <Input
                    id="task-description"
                    placeholder="Enter task description"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                  />
                </div>

                {/* Task Due Date */}
                <div className="grid gap-2">
                  <Label htmlFor="task-due-date">Due Date</Label>
                  <Input
                    id="task-due-date"
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                  />
                </div>

                {/* Task Subtasks */}

                <div className="grid gap-2">
                  <Label htmlFor="subtasks">Subtasks (comma separated)</Label>
                  <Input
                    id="subtasks"
                    placeholder="e.g. Research, Edit"
                    value={newTaskSubtasks}
                    onChange={(e) => setNewTaskSubtasks(e.target.value)}
                  />
                </div>

                {/* Task Priority */}

                <div className="grid gap-2">
                  <Label htmlFor="task-priority">Task Priority</Label>
                  <ToggleGroup
                    variant="outline"
                    type="single"
                    value={newTaskPriority}
                    onValueChange={(value) => setNewTaskPriority(value)}
                  >
                    <ToggleGroupItem value="Low" aria-label="Low Priority">
                      Low
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="Medium"
                      aria-label="Medium Priority"
                    >
                      Medium
                    </ToggleGroupItem>
                    <ToggleGroupItem value="High" aria-label="High Priority">
                      High
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>

              {/* Submit Button */}
              <DialogFooter>
                <Button type="button" onClick={handleSubmitTask}>
                  {editingTaskId !== null ? "Update Task" : "Create Task"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardAction>
      </CardHeader>

      {/* ========== CARD CONTENT: TASK LIST ========== */}
      <CardContent className="px-4">
        {tasks.length === 0 ? (
          /* Empty State */
          <div className="text-center py-8 text-muted-foreground">
            <p>No tasks yet. Click "New" to create your first task!</p>
          </div>
        ) : (
          /* Four coloumn layout */
          <div className="flex gap-4 overflow-x-auto pb-4">
            {renderTaskColumn("To Do", todoTasks, "todo")}
            {renderTaskColumn("In Progress", inProgressTasks, "in-progress")}
            {renderTaskColumn("Completed", completedTasks, "completed")}
            {renderTaskColumn("Overdue", overdueTasks, "overdue")}
          </div>
        )}
      </CardContent>

      {/* ========== DELETE CONFIRMATION DIALOG ========== */}
      <AlertDialog
        open={taskToDelete !== null}
        onOpenChange={(open) => !open && cancelDelete()}
      >
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this task. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTask}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========== VIEW TASK DIALOG ========== */}
      <Dialog
        open={viewTask !== null}
        onOpenChange={(open) => !open && setViewTask(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewTask?.name}</DialogTitle>
            <DialogDescription>Task Details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Description */}
            <div>
              <Label className="text-sm font-medium">Description</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {viewTask?.description || "No description provided"}
              </p>
            </div>

            {/* Priority */}
            <div>
              <Label className="text-sm font-medium">Priority</Label>
              <p className="text-sm mt-1">
                <span
                  className={
                    `text-xs px-2 py-1 rounded-full border font-bold uppercase tracking-wider ${getPriorityStyle(viewTask?.priority)}`}
                >
                  {viewTask?.priority}
                </span>
              </p>
            </div>

            {/* Due Date */}
            <div>
              <Label className="text-sm font-medium">Due Date</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {viewTask?.dueDate
                  ? new Date(viewTask.dueDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "No due date set"}
              </p>
            </div>

            {/* Subtasks */}
            <div>
              <Label className="text-sm font-medium">Subtasks</Label>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                {viewTask?.subtasks?.length > 0 ? (
                  viewTask.subtasks.map((sub, index) => (
                    <li key={index}>{sub}</li>
                  ))
                ) : (
                  <li>No subtasks</li>
                )}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setViewTask(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
