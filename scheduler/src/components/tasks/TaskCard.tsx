"use client";
import * as React from "react";
import { TaskActions } from "@/src/components/task-actions";
import { Checkbox } from "@/components/ui/checkbox";

const PRIORITY_COLORS: Record<string, string> = {
  High:   "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-orange-100 text-orange-700 border-orange-200",
  Low:    "bg-green-100 text-green-700 border-green-200",
};

interface TaskCardProps {
  task:            any;
  onToggle:        (id: string, status?: string) => void;
  onView:          (task: any) => void;
  onEdit:          (id: string) => void;
  onDelete:        (id: string) => void;
  // For colour coding — pass from ToDoList
  categories?:     { id: string; name: string; color: string }[];
  events?:         { id: string; title: string; category: string }[];
}

export function TaskCard({
  task,
  onToggle,
  onView,
  onEdit,
  onDelete,
  categories = [],
  events     = [],
}: TaskCardProps) {
  // Resolve linked event + category colour
  const linkedEvent = task.eventId ? events.find((e: any) => e.id === task.eventId) : null;
  const linkedCat   = linkedEvent  ? categories.find((c: any) => c.name === linkedEvent.category) : null;
  const accentColor = linkedCat?.color ?? null;

  const priorityStyle = PRIORITY_COLORS[task.priority] ?? "bg-gray-100 text-gray-600 border-gray-200";

  const subtasksList = React.useMemo(() => {
    if (!task.subtasks) return [];
    return Array.isArray(task.subtasks)
      ? task.subtasks
      : String(task.subtasks).split(",").filter((s: string) => s.trim() !== "");
  }, [task.subtasks]);

  const [checkedList, setCheckedList] = React.useState(() => {
    if (task.status === "completed") return new Array(subtasksList.length).fill(true);
    return new Array(subtasksList.length).fill(false);
  });

  // Due-date urgency
  const daysUntilDue = task.dueDate
    ? Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / 86_400_000)
    : null;
  const isUrgent  = daysUntilDue !== null && daysUntilDue <= 3 && task.status !== "completed";
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0  && task.status !== "completed";

  return (
    <div className="rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
      style={accentColor ? { borderColor: accentColor + "60" } : {}}>

      {/* Coloured top stripe for event-linked tasks */}
      {accentColor && <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />}

      <div className="flex items-center gap-2 p-3"
        style={accentColor ? { backgroundColor: accentColor + "08" } : {}}>

        {/* Drag handle */}
        <span className="text-gray-300 text-sm cursor-grab select-none">⋮⋮</span>

        {/* Checkbox */}
        <Checkbox
          id={`task-${task.id}`}
          checked={task.status === "completed"}
          onCheckedChange={() => onToggle(task.id, task.status === "completed" ? "todo" : "completed")}
          className="shrink-0 h-4 w-4"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-1">
            <span className={`text-sm font-semibold truncate ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-800"}`}>
              {task.title}
            </span>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Priority badge */}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${priorityStyle}`}>
                {task.priority}
              </span>

              {/* Event/category badge */}
              {linkedEvent && accentColor && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white"
                  style={{ backgroundColor: accentColor }}>
                  {linkedCat?.name ?? linkedEvent.title}
                </span>
              )}

              {/* Exam badge */}
              {task.exam?.title && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-100 font-medium">
                  {task.exam.title}
                </span>
              )}
            </div>

            {/* Duration + due date row */}
            <div className="flex items-center gap-2 mt-0.5">
              {task.duration > 0 && (
                <span className="text-[10px] text-gray-400">
                  {task.duration < 60
                    ? `${task.duration}m`
                    : `${Math.floor(task.duration / 60)}h${task.duration % 60 > 0 ? ` ${task.duration % 60}m` : ""}`}
                </span>
              )}
              {task.dueDate && (
                <span className={`text-[10px] font-semibold ${isOverdue ? "text-red-500" : isUrgent ? "text-orange-500" : "text-gray-400"}`}>
                  {isOverdue ? "⚠️ " : isUrgent ? "⏰ " : ""}
                  Due {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {isUrgent && !isOverdue && daysUntilDue !== null && ` · ${daysUntilDue}d`}
                </span>
              )}
            </div>

            {/* Progress bar from check-in */}
            {typeof task.progress === "number" && task.progress > 0 && !task.completed && (
              <div className="mt-1">
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${task.progress}%` }} />
                </div>
                <span className="text-[9px] text-amber-500 font-semibold">{task.progress}% done</span>
              </div>
            )}
          </div>

          {/* Subtasks checklist */}
          {subtasksList.length > 0 && (
            <div className="mt-2 pt-2 border-t border-dashed border-gray-100 space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Subtasks</p>
              <div className="flex flex-col gap-1.5">
                {subtasksList.map((sub: string, i: number) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input type="checkbox" checked={checkedList[i] || false}
                      className="h-3 w-3 rounded border-gray-300"
                      onChange={(e) => {
                        e.stopPropagation();
                        const newList = [...checkedList];
                        newList[i] = e.target.checked;
                        setCheckedList(newList);
                        if (newList.length > 0 && newList.every(Boolean) && task.status !== "completed") {
                          onToggle(task.id, "completed");
                        } else if (!newList.every(Boolean) && task.status === "completed") {
                          onToggle(task.id, "in-progress");
                        }
                      }} />
                    <span className="text-[10px] text-gray-500 truncate">
                      {typeof sub === "string" ? sub.trim() : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <TaskActions
          onView={() => onView(task)}
          onEdit={() => onEdit(task.id)}
          onDelete={() => onDelete(task.id)}
        />
      </div>
    </div>
  );
}