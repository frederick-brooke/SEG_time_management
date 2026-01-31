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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Button } from "@/src/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import { Checkbox } from "@/src/components/ui/checkbox";
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
            : "High",
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

  // Filter tasks by status and due date
  const overdueTasks = tasks.filter((task) => isOverdue(task));
  const todoTasks = tasks.filter(
    (task) => task.status === "todo" && !isOverdue(task),
  );
  const inProgressTasks = tasks.filter(
    (task) => task.status === "in-progress" && !isOverdue(task),
  );
  const completedTasks = tasks.filter((task) => task.status === "completed");

  // Render a list of tasks
  const renderTaskList = (taskList, status) => (
    <div className="space-y-3">
      {taskList.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No tasks here
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

            {/* Task Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-sm font-medium ${
                    task.status === "completed"
                      ? "line-through text-muted-foreground"
                      : ""
                  }`}
                >
                  {task.name}
                </span>
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
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleViewTask(task)}
                title="View task"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleEditTask(task.id)}
                title="Edit task"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setTaskToDelete(task.id)}
                title="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))
      )}
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
          /* Tabs Layout */
          <Tabs defaultValue="todo" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="todo" className="relative">
                To Do
                {todoTasks.length > 0 && (
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {todoTasks.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="in-progress" className="relative">
                In Progress
                {inProgressTasks.length > 0 && (
                  <span className="ml-2 rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
                    {inProgressTasks.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="relative">
                Completed
                {completedTasks.length > 0 && (
                  <span className="ml-2 rounded-full bg-green-500 px-2 py-0.5 text-xs text-white">
                    {completedTasks.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="overdue" className="relative">
                Overdue
                {overdueTasks.length > 0 && (
                  <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                    {overdueTasks.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overdue" className="mt-4">
              {renderTaskList(overdueTasks, "overdue")}
            </TabsContent>

            <TabsContent value="todo" className="mt-4">
              {renderTaskList(todoTasks, "todo")}
            </TabsContent>

            <TabsContent value="in-progress" className="mt-4">
              {renderTaskList(inProgressTasks, "in-progress")}
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              {renderTaskList(completedTasks, "completed")}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
