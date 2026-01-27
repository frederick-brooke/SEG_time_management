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
import { Button } from "@/src/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";

export const description = "An interactive area chart";

const handleSort = () => {
  console.log("Sorting tasks...");
};

const handleCreateTask = () => {
  console.log("Creating a new task...");
};

const taskColumns = [
  {
    id: "drag",
    // Drag handle column
  },
  {
    id: "taskName",
    header: "Task",
    // Display task name
  },
  {
    id: "priority",
    header: "Priority",
    // Display priority badge
  },
  {
    id: "actions",
    // Edit, Delete, View buttons
  },
];

const handleEditTask = (taskId) => {
  console.log("Edit task:", taskId);
};

const handleDeleteTask = (taskId) => {
  const updatedTasks = tasks.filter((task) => task.id !== taskId);
  setTasks(updatedTasks);
};

const handleViewTask = (task) => {
  console.log("View task:", task);
};

export function ToDoList() {
  const [tasks, setTasks] = React.useState([
    {
      id: 1,
      name: "Complete project proposal",
      priority: "High",
      description: "Write a detailed proposal for the new client project",
    },
    {
      id: 2,
      name: "Review code changes",
      priority: "Medium",
      description: "Review the pull requests from the team",
    },
  ]);

  const [newTaskName, setNewTaskName] = React.useState("");
  const [newTaskDescription, setNewTaskDescription] = React.useState("");
  const [newTaskPriority, setNewTaskPriority] = React.useState("!");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleSubmitTask = (e) => {
    if (!newTaskName.trim()) {
      alert("Please enter a task name.");
      return;
    }

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
    };

    setTasks([...tasks, newTask]);

    setNewTaskName("");
    setNewTaskDescription("");
    setNewTaskPriority("!");

    setIsDialogOpen(false);
  };
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>TO DO LIST</CardTitle>
        <CardDescription>
          <span>Get ahead of your tasks!</span>
          <span className="@[540px]/card:hidden">Last 3 months</span>
        </CardDescription>
        <CardAction className="flex gap-2">
          <Button onClick={handleSort}>Sort</Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateTask}>New</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a new task to your list
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="task-name">Task Name</Label>
                  <Input
                    id="task-name"
                    placeholder="Enter task name"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="task-description">Task Description</Label>
                  <Input
                    id="task-description"
                    placeholder="Enter task description"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="task-priority">Task Priority</Label>
                  <ToggleGroup
                    variant="outline"
                    type="single"
                    value={newTaskPriority}
                    onValueChange={(value) => setNewTaskPriority(value)}
                  >
                    <ToggleGroupItem value="!" aria-label="Toggle !">
                      !
                    </ToggleGroupItem>
                    <ToggleGroupItem value="!!" aria-label="Toggle !!">
                      !!
                    </ToggleGroupItem>
                    <ToggleGroupItem value="!!!" aria-label="Toggle !!!">
                      !!!
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" onClick={handleSubmitTask}>
                  Create Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardAction>
      </CardHeader>
      <CardContent className="px-4">
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              {/* Left side: Drag handle + Task info */}
              <div className="flex items-center gap-3 flex-1">
                {/* Drag Handle Placeholder */}
                <Button variant="ghost" size="icon" className="cursor-grab">
                  <span className="text-muted-foreground">⋮⋮</span>
                </Button>

                <div className="flex items-center gap-2 flex-1">
                  <span>{task.name}</span>
                  <span className="text-xs px-2 py-1 rounded bg-muted">
                    {task.priority}
                  </span>
                </div>
              </div>

              {/* Right side: Action buttons */}
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
                  onClick={() => handleDeleteTask(task.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
