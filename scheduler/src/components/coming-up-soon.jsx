"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "components/ui/button";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Calendar } from "lucide-react";

export function ComingSoonCard() {
  const [tasks, setTasks] = React.useState([]);

  // Load tasks from localStorage
  // Load tasks from localStorage and listen for changes
  React.useEffect(() => {
    const loadTasks = () => {
      if (typeof window !== "undefined") {
        const savedTasks = localStorage.getItem("todo-tasks");
        if (savedTasks) {
          setTasks(JSON.parse(savedTasks));
        }
      }
    };

    // Load initially
    loadTasks();

    // Listen for storage events (when localStorage changes in another tab/window)
    window.addEventListener("storage", loadTasks);

    // Poll for changes every 2 seconds (for same-page updates)
    const interval = setInterval(loadTasks, 2000);

    return () => {
      window.removeEventListener("storage", loadTasks);
      clearInterval(interval);
    };
  }, []);

  // Helper: Check if a task is coming up soon (due within next 7 days)
  const isComingSoon = (task) => {
    const dateValue = task.dueDate || task.due;
    if (!dateValue) return false;

    if (task.status === "completed" || task.completed === true) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateValue);

    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    return dueDate >= today && dueDate <= sevenDaysFromNow;
  };

  // Filter for coming soon tasks
  const comingSoonTasks = tasks
  .filter((task) => isComingSoon(task))
  .sort((a, b) => new Date(a.dueDate || a.due)- new Date(b.dueDate || b.due));


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          Coming Up Soon
        </CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {comingSoonTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks due soon</p>
        ) : (
          <div className="space-y-3">
            {comingSoonTasks.map((task) => {
              const displayDate = task.dueDate || task.due;

              return (
                <div
                key={task.id}
                className="flex items-start justify-between border-b pb-2 last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium">{task.name || task.text || "Untitled Task"}</p>
                  <p className="text-xs text-muted-foreground">
                    Due:{" "}
                    {new Date(displayDate).toLocaleDateString("en-GB", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded bg-muted ${
                  task.priority === "High" ? "bg-red-100 text-red-700" :
                  task.priority === "Medium" ? "bg-orange-100 text-orange-700" :
                  "bg-blue-100 text-blue-700"}`}>
                    {task.priority}
                </span>
              </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
