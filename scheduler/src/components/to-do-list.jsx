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
            }
          : task,
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
      };
      setTasks([...tasks, newTask]);
    }
    setNewTaskSubtasks("");

    // Reset form fields and close dialog
    setNewTaskName("");
    setNewTaskDescription("");
    setNewTaskPriority("Low");
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
            : "High",
      );
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

  // Filter tasks by status
  const todoTasks = tasks.filter((task) => task.status === "todo");
  const inProgressTasks = tasks.filter((task) => task.status === "in-progress");
  const completedTasks = tasks.filter((task) => task.status === "completed");

  const renderTaskColumn = (title, taskList, status) => (
    <div className="flex-1 min-w-[300px] rounded-lg border bg-muted/20 p-4">
      {/* column header*/}
      <div className="mb-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground">
          {taskList.length} {taskList.length === 1 ? "task" : "tasks"}
        </p>
      </div>
      {/* Task List */}
      <div className="space-y-2">
        {taskList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No tasks here
          </div>
        ) : (
          taskList.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 rounded-lg border p-2.5 bg-card shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Left Side: Drag Handle + Checkbox + Task Info */}
              <div className="flex items-center gap-3 flex-1">
                {/* Drag Handle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="ch-8 w-8 cursor-grab shrink-0"
                >
                  <span className="text-muted-foreground text-sm">⋮⋮</span>
                </Button>

                {/* Checkbox + Task Name and Priority */}
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox
                    id={"task-${task.id}"}
                    checked={task.status === "completed"}
                    onCheckedChange={() => handleToggleComplete(task.id)}
                    className="shrink-0 h-3 w-3"
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className={`text-sm truncate ${
                        task.status === "completed"
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {task.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side: Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => handleViewTask(task)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => handleEditTask(task.id)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setTaskToDelete(task.id)}
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

                {/* Task Priority */}

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
          /* Three Column Layout */
          <div className="flex gap-4 overflow-x-auto pb-4">
            {renderTaskColumn("To Do", todoTasks, "todo")}
            {renderTaskColumn("In Progress", inProgressTasks, "in-progress")}
            {renderTaskColumn("Completed", completedTasks, "completed")}
          </div>
        )}

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
              <AlertDialogCancel onClick={cancelDelete}>
                Cancel
              </AlertDialogCancel>
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
                <Label className="text-sm font-medium space-y-4 py-4">
                  Priority
                </Label>
                <p className="text-sm mt-1">
                  <span className="text-xs px-2 py-1 rounded bg-muted">
                    {viewTask?.priority}
                  </span>
                </p>
              </div>
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

            <DialogFooter>
              <Button onClick={() => setViewTask(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
