"use client";
import { format } from "date-fns";

const PRIORITY_COLORS: Record<string, string> = {
  High:   "bg-red-100 text-red-600 border-red-200",
  Medium: "bg-orange-100 text-orange-600 border-orange-200",
  Low:    "bg-green-100 text-green-600 border-green-200",
};

interface TaskViewDialogProps {
  task:              any | null;
  isOpen:            boolean;
  onClose:           () => void;
  onEdit?:           (taskId: string) => void;
  // For colour coding — pass your categories array
  categories?:       { id: string; name: string; color: string }[];
  events?:           { id: string; title: string; category: string }[];
}

export function TaskViewDialog({
  task,
  isOpen,
  onClose,
  onEdit,
  categories = [],
  events = [],
}: TaskViewDialogProps) {
  if (!task || !isOpen) return null;

  // Find linked event + category colour
  const linkedEvent  = task.eventId ? events.find((e) => e.id === task.eventId) : null;
  const linkedCat    = linkedEvent  ? categories.find((c) => c.name === linkedEvent.category) : null;
  const accentColor  = linkedCat?.color ?? null;

  const priorityStyle = PRIORITY_COLORS[task.priority] ?? "bg-gray-100 text-gray-600 border-gray-200";

  const relativeLabel = (() => {
    if (task.relativeOffsetDays == null) return null;
    if (task.relativeOffsetDays === 0) return "same day as event";
    if (task.relativeOffsetDays < 0)
      return `${Math.abs(task.relativeOffsetDays)} day${Math.abs(task.relativeOffsetDays) !== 1 ? "s" : ""} before event`;
    return `${task.relativeOffsetDays} day${task.relativeOffsetDays !== 1 ? "s" : ""} after event`;
  })();

  const subtasks = Array.isArray(task.subtasks)
    ? task.subtasks
    : typeof task.subtasks === "string"
      ? task.subtasks.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-md z-[9999]"
      onClick={onClose}>
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>

        {/* Coloured top stripe if linked to an event category */}
        {accentColor && <div className="h-1.5 w-full rounded-t-[32px]" style={{ backgroundColor: accentColor }} />}

        <div className="p-8 pt-6">
          <button onClick={onClose} className="absolute top-5 right-6 text-gray-400 hover:text-black text-xl">✕</button>

          {/* Title row */}
          <div className="flex items-start gap-2 mb-1">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold flex-shrink-0 mt-1">TASK</span>
            <h3 className="text-2xl font-black text-gray-900 leading-tight">{task.title}</h3>
          </div>

          {/* Scheduled time */}
          {task.scheduledTime && (
            <p className="text-gray-400 text-sm mb-4 font-medium">
              {format(new Date(task.scheduledTime), "EEEE, MMMM do · h:mm a")}
            </p>
          )}

          <div className="flex flex-col gap-3 mt-4">

            {/* Priority */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 w-24 flex-shrink-0">Priority</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${priorityStyle}`}>
                {task.priority}
              </span>
            </div>

            {/* Duration */}
            {task.duration > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 w-24 flex-shrink-0">Duration</span>
                <span className="text-sm font-semibold text-gray-800">
                  {task.duration < 60 ? `${task.duration}m` : `${Math.floor(task.duration / 60)}h ${task.duration % 60 > 0 ? `${task.duration % 60}m` : ""}`}
                </span>
              </div>
            )}

            {/* Due date */}
            {task.dueDate && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 w-24 flex-shrink-0">Due</span>
                <span className="text-sm font-semibold text-gray-800">
                  {format(new Date(task.dueDate), "MMMM d, yyyy")}
                </span>
              </div>
            )}

            {/* Linked event */}
            {linkedEvent && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                style={accentColor ? { backgroundColor: accentColor + "15", borderColor: accentColor + "40" } : {}}>
                <span style={{ color: accentColor ?? "#6366f1" }}>🔗</span>
                <div>
                  <p className="text-xs font-bold" style={{ color: accentColor ?? "#4f46e5" }}>{linkedEvent.title}</p>
                  {relativeLabel && <p className="text-xs text-gray-400">{relativeLabel}</p>}
                </div>
              </div>
            )}

            {/* Recurring */}
            {task.isRecurring && (
              <div className="px-3 py-2 bg-indigo-50 rounded-xl text-xs text-indigo-700 font-medium flex items-center gap-2 border border-indigo-100">
                <span>🔁</span><span>Recurring · {task.recurrence?.type}</span>
              </div>
            )}

            {/* Progress from last check-in */}
            {typeof task.progress === "number" && task.progress > 0 && !task.completed && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-600">⏳ In progress</span>
                  <span className="text-xs font-bold text-amber-600">{task.progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${task.progress}%` }} />
                </div>
              </div>
            )}

            {/* Completed badge */}
            {task.completed && (
              <div className="px-3 py-2 bg-green-50 rounded-xl text-xs text-green-700 font-medium border border-green-100">
                ✓ Completed
              </div>
            )}

            {/* Description */}
            {task.description && (
              <div className="border-t pt-3 mt-1">
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Description</p>
                <p className="text-sm text-gray-600">{task.description}</p>
              </div>
            )}

            {/* Study resource */}
            {task.url && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Study Resource</p>
                <a href={task.url} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                  🔗 View Resource
                </a>
              </div>
            )}

            {/* Exam */}
            {task.exam?.title && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Linked Exam</p>
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full font-medium">
                  {task.exam.title}
                </span>
              </div>
            )}

            {/* Subtasks */}
            {subtasks.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Subtasks</p>
                <div className="flex flex-col gap-1.5">
                  {subtasks.map((sub: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{sub}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Edit button */}
          {onEdit && (
            <button onClick={() => { onEdit(task.id); onClose(); }}
              className="w-full mt-6 bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all">
              Edit Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}