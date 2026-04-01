"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";

type EntryStatus = "completed" | "partial" | "missed" | null;

interface TaskEntry {
  taskId:        string;
  title:         string;
  duration:      number;
  priority:      string;
  scheduledDate: string;
  eventTitle?:   string | null;
  status:        EntryStatus;
  progress:      number; // 0–100, only used for "partial"
}

interface CheckInModalProps {
  // onDone receives the full tasksToReschedule array (with remainingDuration),
  // not just IDs, so CalendarView can show the RescheduleModal
  onDone: (tasksToReschedule: any[]) => void;
}

export default function CheckInModal({ onDone }: CheckInModalProps) {
  const [tasks,   setTasks]   = useState<TaskEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res  = await fetch("/api/checkin");
        const data = await res.json();
        const raw: any[] = data.tasks || [];
        if (raw.length === 0) { setLoading(false); return; }
        setTasks(raw.map((t) => ({
          taskId:        t.id,
          title:         t.title,
          duration:      t.duration,
          priority:      t.priority,
          scheduledDate: t.scheduledDate,
          eventTitle:    t.event?.title ?? null,
          status:        null,
          progress:      100,
        })));
        setVisible(true);
      } catch (e) {
        console.error("CheckIn fetch error", e);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, []);

  if (loading || !visible) return null;

  const allAnswered = tasks.every((t) => t.status !== null);
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setSaving(true);
    const entries = tasks.map((t) => ({
      taskId:   t.taskId,
      status:   t.status!,
      progress: t.status === "partial" ? t.progress
               : t.status === "completed" ? 100 : 0,
    }));
    try {
      const res  = await fetch("/api/checkin", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ entries }),
      });
      const data = await res.json();
      setVisible(false);
      onDone(data.tasksToReschedule || []);
    } catch (e) {
      console.error("CheckIn submit error", e);
    } finally {
      setSaving(false);
    }
  };

  const setEntry = (taskId: string, patch: Partial<TaskEntry>) =>
    setTasks((prev) => prev.map((t) => t.taskId === taskId ? { ...t, ...patch } : t));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-xl">📋</div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Daily Check-in</h2>
              <p className="text-sm text-gray-400">How did you get on with these tasks?</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{completedCount} of {tasks.length} marked</span>
              <span>{Math.round((completedCount / tasks.length) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all w-[var(--progress)]"
              style={{ "--progress": `${(completedCount / tasks.length) * 100}%` } as React.CSSProperties}
            />
            </div>
          </div>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto px-8 py-5 flex flex-col gap-4">
          {tasks.map((task) => (
            <div key={task.taskId} className={`rounded-2xl border p-4 transition-all ${
              task.status === "completed" ? "border-green-200 bg-green-50"
              : task.status === "partial"  ? "border-amber-200 bg-amber-50"
              : task.status === "missed"   ? "border-red-100 bg-red-50"
              : "border-gray-200 bg-gray-50"
            }`}>
              {/* Task info */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {task.eventTitle && (
                      <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                        🔗 {task.eventTitle}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {format(new Date(task.scheduledDate), "EEE MMM d")}
                    </span>
                    <span className="text-xs text-gray-400">{task.duration}m</span>
                    <span className={`text-xs font-bold ${
                      task.priority === "High"   ? "text-red-500"
                      : task.priority === "Medium" ? "text-orange-500"
                      : "text-green-500"
                    }`}>{task.priority}</span>
                  </div>
                </div>
              </div>

              {/* Status buttons */}
              <div className="flex gap-2">
                {([
                  { key: "completed", label: "✅ Done",    active: "bg-green-600 text-white border-green-600" },
                  { key: "partial",   label: "⏳ Partial", active: "bg-amber-500 text-white border-amber-500" },
                  { key: "missed",    label: "❌ Missed",  active: "bg-red-500   text-white border-red-500"   },
                ] as const).map(({ key, label, active }) => (
                  <button key={key} onClick={() => setEntry(task.taskId, { status: key })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      task.status === key ? active : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Progress slider for partial */}
              {task.status === "partial" && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>How much did you complete?</span>
                    <span className="font-bold">{task.progress}%</span>
                  </div>
                  <Input type="range" min="5" max="95" step="5"
                    value={task.progress}
                    onChange={(e) => setEntry(task.taskId, { progress: Number(e.target.value) })}
                    className="w-full accent-amber-500" />
                  <div className="flex justify-between text-[10px] text-gray-300 mt-0.5">
                    <span>5%</span><span>50%</span><span>95%</span>
                  </div>
                  <p className="text-xs text-amber-600 font-medium mt-1">
                    {Math.round(task.duration * (1 - task.progress / 100))}m remaining will be rescheduled
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 flex-shrink-0">
          {!allAnswered && (
            <p className="text-xs text-center text-gray-400 mb-3">
              Mark all {tasks.length} tasks to continue
            </p>
          )}
          <button onClick={handleSubmit} disabled={!allAnswered || saving}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {saving ? "Saving…" : "Submit Check-in"}
          </button>
          <button onClick={() => { setVisible(false); onDone([]); }}
            className="w-full mt-2 text-sm text-gray-400 hover:text-gray-600 py-2">
            Remind me later
          </button>
        </div>
      </div>
    </div>
  );
}