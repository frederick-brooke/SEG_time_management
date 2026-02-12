"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Calendar } from "lucide-react";
import { TaskActions } from "@/src/components/task-actions";

export function ComingUpSoon({ userId }) {
  // 1. State (variables that can change)
  // Tasks
  // Loading status
  const [tasks, setTasks] = React.useState([]); // starts empty
  const [isLoading, setIsLoading] = React.useState(true); // starts loading

  // 2. Effects (code that runs when component loads)
  // When should we fetch the tasks? as soon as the component loads
  // This runs when the component loads
  React.useEffect(() => {
    fetchTasks();
  }, [userId]); // Run again if userId changes

  const fetchTasks = async () => {
    try {
      // 1. Start loading
      setIsLoading(true);

      // 2. Call API
      // get the package
      const res = await fetch(`/api/tasks?userId=${userId}`);

      // 3. Save response
      // open the package
      const data = await res.json();
      if (data.tasks) {
        // if tasks already exists
        setTasks(data.tasks);
      }
    } catch (error) {
      // Handle errors
      console.error("Failed to fetch tasks:", error);
    } finally {
      // Always stop loading
      setIsLoading(false);
    }
  };

  // 3. Functions (actions/logic)
  const isComingSoon = (task) => {
    // check if a task is coming up
    if (task.status === "completed") {
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    return dueDate >= today && dueDate <= sevenDaysFromNow;
  };

  const comingSoonTasks = tasks
    .filter((t) => isComingSoon(t))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  // 4. Return (what shows on screen)
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

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
            {comingSoonTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start justify-between border-b pb-2 last:border-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Due:{" "}
                    {new Date(task.dueDate).toLocaleDateString("en-GB", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <TaskActions
                  onView={() => console.log("View:", task.id)}
                  onEdit={() => console.log("Edit", task.id)}
                  onDelete={() => console.log("Delete:", task.id)}
                />
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    task.priority === "High"
                      ? "bg-red-100 text-red-700"
                      : task.priority === "Medium"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
