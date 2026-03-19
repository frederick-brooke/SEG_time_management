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
        className={`text-xs font-semibold`}
        style={{ color: urgent ? "#f87171" : "rgba(148,163,255,0.5)" }}
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
          className="text-xs font-semibold"
          style={{ color: urgent ? "#f87171" : "rgba(148,163,255,0.5)" }}
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

  return (
    <span
      className="text-xs italic"
      style={{ color: "rgba(148,163,255,0.35)" }}
    >
      No deadline
    </span>
  );
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

// Shared panel styles matching the messaging page glass aesthetic
const panelStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
  borderRadius: "1rem",
  padding: "1rem",
};

const headingStyle: React.CSSProperties = {
  fontWeight: 700,
  color: "rgba(220,225,255,0.9)",
  marginBottom: "0.75rem",
  fontSize: "0.875rem",
  letterSpacing: "0.02em",
};

const emptyStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "rgba(148,163,255,0.35)",
};

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
      <div style={panelStyle}>
        <h2 style={headingStyle}>Unscheduled Tasks</h2>
        {unscheduledTasks.length === 0 ? (
          <p style={emptyStyle}>All tasks are scheduled!</p>
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
                  className="group overflow-hidden cursor-pointer transition-all"
                  onClick={() => onTaskClick(t)}
                  style={{
                    borderRadius: "0.75rem",
                    border: `1px solid ${tagColor ? tagColor + "40" : "rgba(255,255,255,0.07)"}`,
                    background: "rgba(255,255,255,0.02)",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      tagColor ? tagColor + "18" : "rgba(148,163,255,0.06)";
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      tagColor ? tagColor + "70" : "rgba(148,163,255,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "rgba(255,255,255,0.02)";
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      tagColor ? tagColor + "40" : "rgba(255,255,255,0.07)";
                  }}
                >
                  {tagColor && (
                    <div
                      className="h-0.5 w-full"
                      style={{ backgroundColor: tagColor, opacity: 0.8 }}
                    />
                  )}
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: "rgba(220,225,255,0.85)" }}
                      >
                        {t.title}
                      </p>
                      <span
                        className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1"
                        style={{ color: "rgba(148,163,255,0.8)" }}
                      >
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
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={
                          t.priority === "High"
                            ? {
                                background: "rgba(239,68,68,0.15)",
                                color: "#f87171",
                                border: "1px solid rgba(239,68,68,0.25)",
                              }
                            : t.priority === "Medium"
                              ? {
                                  background: "rgba(251,146,60,0.15)",
                                  color: "#fb923c",
                                  border: "1px solid rgba(251,146,60,0.25)",
                                }
                              : {
                                  background: "rgba(74,222,128,0.1)",
                                  color: "#4ade80",
                                  border: "1px solid rgba(74,222,128,0.2)",
                                }
                        }
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
      <div style={panelStyle}>
        <h2 style={headingStyle}>Schedule Log</h2>
        {scheduleLogs.length === 0 ? (
          <p style={emptyStyle}>No schedules created yet.</p>
        ) : (
          <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
            {scheduleLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={
                      log.mode === "day"
                        ? {
                            background: "rgba(220,225,255,0.1)",
                            color: "rgba(220,225,255,0.8)",
                            border: "1px solid rgba(220,225,255,0.15)",
                          }
                        : {
                            background: "rgba(148,163,255,0.15)",
                            color: "rgba(148,163,255,0.9)",
                            border: "1px solid rgba(148,163,255,0.25)",
                          }
                    }
                  >
                    {log.mode === "day" ? "Day" : "Week"}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "rgba(148,163,255,0.4)" }}
                  >
                    {format(new Date(log.scheduledAt), "MMM d, h:mm a")}
                  </span>
                </div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "rgba(220,225,255,0.85)" }}
                >
                  {log.dateLabel}
                </p>
                <p
                  className="text-xs mb-2"
                  style={{ color: "rgba(148,163,255,0.45)" }}
                >
                  {log.taskIds.length} task{log.taskIds.length !== 1 ? "s" : ""}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEditLog(log)}
                    className="flex-1 text-xs py-1.5 rounded-lg font-bold transition-all"
                    style={{
                      background: "rgba(148,163,255,0.12)",
                      color: "rgba(148,163,255,0.9)",
                      border: "1px solid rgba(148,163,255,0.2)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(148,163,255,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(148,163,255,0.12)";
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteLog(log.id)}
                    className="flex-1 text-xs py-1.5 rounded-lg font-bold transition-all"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      color: "#f87171",
                      border: "1px solid rgba(239,68,68,0.18)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(239,68,68,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(239,68,68,0.08)";
                    }}
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