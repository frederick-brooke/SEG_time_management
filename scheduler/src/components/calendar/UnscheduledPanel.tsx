"use client";
import { format } from "date-fns";
import { getNextOccurrenceDeadline } from "@/lib/taskSchedulingUtils";

// ---------------------------------------------------------------------------
// DeadlineBadge
// ---------------------------------------------------------------------------
function DeadlineBadge({ task, events }: { task: any; events: any[] }) {
  const now = new Date();

  if (task.dueDate) {
    const due = new Date(task.dueDate);
    const daysLeft = Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
    const urgent = daysLeft <= 3;
    return (
      <span
        className={`text-xs font-semibold ${urgent ? "text-red-500" : "text-gray-400"}`}
      >
        {urgent ? "⚠️ " : ""}Due {format(due, "MMM d, yyyy")}
        {daysLeft === 0
          ? " · today"
          : daysLeft < 0
            ? " · overdue"
            : urgent
              ? ` · ${daysLeft}d left`
              : ""}
      </span>
    );
  }

  if (task.eventId && task.relativeOffsetDays != null) {
    const linked = events.find((e: any) => e.id === task.eventId);
    if (linked) {
      const nextDeadline = getNextOccurrenceDeadline(
        linked,
        task.relativeOffsetDays,
        now,
      );
      const deadline =
        nextDeadline ??
        (() => {
          const d = new Date(linked.start);
          d.setDate(d.getDate() + (task.relativeOffsetDays ?? 0));
          return d;
        })();
      const daysLeft = Math.ceil(
        (deadline.getTime() - now.getTime()) / 86_400_000,
      );
      const urgent = daysLeft <= 3;
      return (
        <span
          className={`text-xs font-semibold ${urgent ? "text-red-500" : "text-gray-400"}`}
        >
          {urgent ? "⚠️ " : ""}Finish by {format(deadline, "MMM d, yyyy")}
          {daysLeft === 0
            ? " · today"
            : daysLeft < 0
              ? " · overdue"
              : urgent
                ? ` · ${daysLeft}d left`
                : ""}
        </span>
      );
    }
  }

  return <span className="text-xs text-gray-400 italic">No deadline</span>;
}

// ---------------------------------------------------------------------------
// UnscheduledPanel
// ---------------------------------------------------------------------------
interface UnscheduledPanelProps {
  unscheduledTasks: any[];
  scheduleLogs: any[];
  events: any[];
  categories: any[];
  onTaskClick: (task: any) => void;
  onEditLog: (log: any) => void;
  onDeleteLog: (logId: string) => void;
}

export default function UnscheduledPanel({
  unscheduledTasks,
  scheduleLogs,
  events,
  categories,
  onTaskClick,
  onEditLog,
  onDeleteLog,
}: UnscheduledPanelProps) {
  return (
    <div className="w-64 flex-shrink-0 flex flex-col gap-4 sticky top-4 self-start">
      {/* Unscheduled Tasks */}
      <div className="bg-white rounded-2xl border p-4 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-3">Unscheduled Tasks</h2>
        {unscheduledTasks.length === 0 ? (
          <p className="text-xs text-gray-400">All tasks are scheduled 🎉</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {unscheduledTasks.map((t: any) => {
              const linkedEvent = t.eventId
                ? events.find((e: any) => e.id === t.eventId)
                : null;
              const linkedCat = linkedEvent
                ? categories.find((c: any) => c.name === linkedEvent.category)
                : null;
              const tagColor = linkedCat?.color ?? null;
              return (
                <div
                  key={t.id}
                  className="rounded-xl border cursor-pointer hover:border-indigo-300 transition-all group overflow-hidden"
                  onClick={() => onTaskClick(t)}
                  style={tagColor ? { borderColor: tagColor + "60" } : {}}
                >
                  {tagColor && (
                    <div
                      className="h-1 w-full"
                      style={{ backgroundColor: tagColor }}
                    />
                  )}
                  <div
                    className="p-3 transition-all group-hover:bg-indigo-50"
                    style={
                      tagColor
                        ? { backgroundColor: tagColor + "12" }
                        : { backgroundColor: "#f9fafb" }
                    }
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {t.title}
                      </p>
                      <span className="text-xs text-indigo-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1">
                        Schedule →
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {linkedCat && (
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: tagColor! }}
                        >
                          {linkedCat.name}
                        </span>
                      )}
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          t.priority === "High"
                            ? "bg-red-100 text-red-600"
                            : t.priority === "Medium"
                              ? "bg-orange-100 text-orange-600"
                              : "bg-green-100 text-green-600"
                        }`}
                      >
                        {t.priority}
                      </span>
                      <DeadlineBadge task={t} events={events} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Log */}
      <div className="bg-white rounded-2xl border p-4 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-3">Schedule Log</h2>
        {scheduleLogs.length === 0 ? (
          <p className="text-xs text-gray-400">No schedules created yet.</p>
        ) : (
          <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
            {scheduleLogs.map((log) => (
              <div key={log.id} className="p-3 bg-gray-50 rounded-xl border">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      log.mode === "day"
                        ? "bg-gray-900 text-white"
                        : "bg-indigo-600 text-white"
                    }`}
                  >
                    {log.mode === "day" ? "Day" : "Week"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {format(new Date(log.scheduledAt), "MMM d, h:mm a")}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  {log.dateLabel}
                </p>
                <p className="text-xs text-gray-400 mb-2">
                  {log.taskIds.length} task{log.taskIds.length !== 1 ? "s" : ""}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEditLog(log)}
                    className="flex-1 text-xs bg-gray-900 text-white py-1.5 rounded-lg font-bold hover:bg-black"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteLog(log.id)}
                    className="flex-1 text-xs bg-red-50 text-red-600 py-1.5 rounded-lg font-bold hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
