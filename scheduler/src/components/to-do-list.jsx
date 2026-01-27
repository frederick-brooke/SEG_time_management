"use client";

import * as React from "react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/src/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { Button } from "@/src/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import { Checkbox } from "@/src/components/ui/checkbox";

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
              subtasks: newTaskSubtasks.split(",").map(s => s.trim()).filter(s => s !== ""),
              priority:
                newTaskPriority === "!"
                  ? "Low"
                  : newTaskPriority === "!!"
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
          newTaskPriority === "!"
            ? "Low"
            : newTaskPriority === "!!"
              ? "Medium"
              : "High",
        description: newTaskDescription,
        completed: false,
        subtasks: newTaskSubtasks.split(",").map(s => s.trim()).filter(s => s !== ""),
    };
      setTasks([...tasks, newTask]);
    }
    setNewTaskSubtasks("");

    // Reset form fields and close dialog
    setNewTaskName("");
    setNewTaskDescription("");
    setNewTaskPriority("!");
    setIsDialogOpen(false);
  };

  // Handler: Open edit dialog with task data
  const handleEditTask = (taskId) => {
    const taskToEdit = tasks.find((task) => task.id === taskId);
    if (taskToEdit) {
      setEditingTaskId(taskId);
      setNewTaskName(taskToEdit.name);
      setNewTaskDescription(taskToEdit.description);
      setNewTaskSubtasks(taskToEdit.subtasks?.join(", " || ""))
      // Convert priority from words back to symbols
      setNewTaskPriority(
        taskToEdit.priority === "Low"
          ? "!"
          : taskToEdit.priority === "Medium"
            ? "!!"
            : "!!!",
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
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task,
    );
    setTasks(updatedTasks);
  };

  // Handler: Sort tasks
  const handleSort = () => {
    const priorityMap = { "High": 3, "Medium": 2, "Low": 1 };
    const sortedByPriority = [...tasks].sort((a, b) => {
      return priorityMap[b.priority] - priorityMap[a.priority];
    });
    setTasks(sortedByPriority);
  }

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
                    <ToggleGroupItem value="!" aria-label="Low Priority">
                      !
                    </ToggleGroupItem>
                    <ToggleGroupItem value="!!" aria-label="Medium Priority">
                      !!
                    </ToggleGroupItem>
                    <ToggleGroupItem value="!!!" aria-label="High Priority">
                      !!!
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
          /* Task List */
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                {/* Left Side: Drag Handle + Task Info */}
                <div className="flex items-center gap-3 flex-1">
                  {/* Drag Handle (placeholder - not functional yet) */}
                  <Button variant="ghost" size="icon" className="cursor-grab">
                    <span className="text-muted-foreground">⋮⋮</span>
                  </Button>

                  {/* Checkbox + Task Name and Priority */}
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.completed}
                      onCheckedChange={() => handleToggleComplete(task.id)}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <span
                        className={
                          task.completed
                            ? "line-through text-muted-foreground"
                            : ""
                        }
                      >
                        {task.name}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-muted">
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Action Buttons */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewTask(task)}
                  >
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditTask(task.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTaskToDelete(task.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
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
                <Label className="text-sm font-medium">Priority</Label>
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
                {viewTask?.subtasks?.length > 0 ?(
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
