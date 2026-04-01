"use client";

/**
 * Event Form Parts component
 */

import { useState } from "react";
import { Button } from "../ui/Button";

// Constants
export type RelativeOption =
  | "3-before"
  | "2-before"
  | "1-before"
  | "same-day"
  | "1-after"
  | "2-after"
  | "3-after"
  | "custom";

export const RELATIVE_OPTIONS: {
  key: RelativeOption;
  label: string;
  offsetDays: number | null;
}[] = [
  { key: "3-before", label: "3 days before", offsetDays: -3 },
  { key: "2-before", label: "2 days before", offsetDays: -2 },
  { key: "1-before", label: "1 day before", offsetDays: -1 },
  { key: "same-day", label: "Same day", offsetDays: 0 },
  { key: "1-after", label: "1 day after", offsetDays: 1 },
  { key: "2-after", label: "2 days after", offsetDays: 2 },
  { key: "3-after", label: "3 days after", offsetDays: 3 },
  { key: "custom", label: "Custom date", offsetDays: null },
];

export function relativeTo(mode: RelativeOption) {
  if (mode === "custom") return "custom";
  if (mode === "same-day") return "during";
  if (mode.includes("before")) return "before";
  return "after";
}

// TaskPromptSection
import { LinkedTaskCard } from "./LinkedTaskCard";
import { NewTaskForm } from "./NewTaskForm";

interface TaskPromptSectionProps {
  createdEventId: string;
  userId: string;
  eventStartDate: string;
  defaultUntil: string;
  onFinish: () => void;
}

export function TaskPromptSection({
  createdEventId,
  userId,
  eventStartDate,
  defaultUntil,
  onFinish,
}: TaskPromptSectionProps) {
  const [linkedTasks, setLinkedTasks] = useState<any[]>([]);

  const handleAdd = (task: any) =>
    setLinkedTasks((prev) => [
      ...prev,
      { ...task, userId, eventId: createdEventId },
    ]);

  const handleSave = async () => {
    if (linkedTasks.length > 0) {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: linkedTasks }),
      });
      window.dispatchEvent(new Event("tasks-updated"));
    }
    onFinish();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl">
        <h3 className="font-bold text-white mb-1">Link tasks to this event?</h3>
        <p className="text-sm text-white/40">
          Tasks will be scheduled relative to each occurrence, or left
          unscheduled for you to place manually.
        </p>
      </div>

      {linkedTasks.length > 0 && (
        <div className="flex flex-col gap-2">
          {linkedTasks.map((t, i) => (
            <LinkedTaskCard
              key={i}
              task={t}
              index={i}
              eventStartDate={eventStartDate}
              onUpdate={(idx: number, updated: any) =>
                setLinkedTasks((prev) =>
                  prev.map((item, j) => (j === idx ? updated : item)),
                )
              }
              onRemove={(idx: number) =>
                setLinkedTasks((prev) => prev.filter((_, j) => j !== idx))
              }
            />
          ))}
        </div>
      )}

      <NewTaskForm
        eventStartDate={eventStartDate}
        defaultUntil={defaultUntil}
        onAdd={handleAdd}
      />

      <Button
        onClick={handleSave}
        className="w-full bg-white text-gray-900 py-4 rounded-2xl font-bold hover:bg-white/90 transition-all"
      >
        {linkedTasks.length > 0 ? "Save Tasks & Finish" : "Skip — No Tasks"}
      </Button>
    </div>
  );
}