"use client";
import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/Button";

interface RescheduleTask {
  id:                string;
  title:             string;
  duration:          number;   // original duration
  remainingDuration: number;   // adjusted duration for rescheduling
  priority:          string;
  dueDate?:          string | null;
  eventId?:          string | null;
  relativeOffsetDays?: number | null;
}

interface RescheduleModalProps {
  tasks:       RescheduleTask[];
  weekStart:   Date; // first remaining day of the week (today)
  weekEnd:     Date; // last day of the current week (Sunday)
  onConfirm:   (taskIds: string[]) => Promise<void>;
  onDismiss:   () => void;
}

export default function RescheduleModal({
  tasks,
  weekStart,
  weekEnd,
  onConfirm,
  onDismiss,
}: RescheduleModalProps) {
  const [saving,     setSaving]     = useState(false);
  // Allow user to deselect tasks they don't want rescheduled
  const [selected, setSelected]     = useState<Set<string>>(new Set(tasks.map((t) => t.id)));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onConfirm(Array.from(selected));
    } finally {
      setSaving(false);
    }
  };

  const remainingDays = Math.max(
    1,
    Math.ceil((weekEnd.getTime() - weekStart.getTime()) / 86_400_000) + 1,
  );

  const totalMins = tasks
    .filter((t) => selected.has(t.id))
    .reduce((sum, t) => sum + t.remainingDuration, 0);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-xl">📋</div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Reschedule Remaining</h2>
              <p className="text-sm text-gray-400">
                {remainingDays} day{remainingDays !== 1 ? "s" : ""} left this week ·{" "}
                {format(weekStart, "MMM d")}–{format(weekEnd, "MMM d")}
              </p>
            </div>
          </div>

          {/* Summary strip */}
          <div className="mt-4 flex gap-3">
            <div className="flex-1 bg-amber-50 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-amber-700">{tasks.length}</p>
              <p className="text-xs text-amber-500 font-semibold">tasks to carry over</p>
            </div>
            <div className="flex-1 bg-indigo-50 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-indigo-700">
                {Math.round(totalMins / 60 * 10) / 10}h
              </p>
              <p className="text-xs text-indigo-500 font-semibold">remaining work</p>
            </div>
            <div className="flex-1 bg-green-50 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-green-700">{remainingDays}</p>
              <p className="text-xs text-green-500 font-semibold">days available</p>
            </div>
          </div>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto px-8 py-5 flex flex-col gap-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Tasks to reschedule — deselect any you want to skip
          </p>

          {tasks.map((task) => {
            const isSelected   = selected.has(task.id);
            const pctDone      = task.duration > 0
              ? Math.round((1 - task.remainingDuration / task.duration) * 100)
              : 0;
            const wasPartial   = pctDone > 0;

            return (
              <div
                key={task.id}
                onClick={() => toggle(task.id)}
                className={`rounded-2xl border p-4 cursor-pointer transition-all ${
                  isSelected
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-gray-200 bg-gray-50 opacity-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                    isSelected ? "bg-indigo-600" : "border-2 border-gray-300 bg-white"
                  }`}>
                    {isSelected && <span className="text-white text-[11px] font-black">✓</span>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{task.title}</p>

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {/* Priority */}
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        task.priority === "High"   ? "bg-red-100 text-red-600"
                        : task.priority === "Medium" ? "bg-orange-100 text-orange-600"
                        : "bg-green-100 text-green-600"
                      }`}>{task.priority}</span>

                      {/* Remaining duration */}
                      <span className="text-xs text-gray-500 font-medium">
                        {task.remainingDuration}m remaining
                        {wasPartial && (
                          <span className="text-amber-500 ml-1">({pctDone}% done)</span>
                        )}
                      </span>

                      {/* Due date if present */}
                      {task.dueDate && (
                        <span className="text-xs text-gray-400">
                          Due {format(new Date(task.dueDate), "MMM d")}
                        </span>
                      )}
                    </div>

                    {/* Progress bar for partial tasks */}
                    {wasPartial && (
                      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${pctDone}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 flex-shrink-0 flex flex-col gap-3">
          <Button
            onClick={handleConfirm}
            disabled={saving || selected.size === 0}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving
              ? "Scheduling…"
              : selected.size === 0
                ? "No tasks selected"
                : `Reschedule ${selected.size} task${selected.size !== 1 ? "s" : ""} into remaining week`}
          </Button>
          <Button
            onClick={onDismiss}
            className="w-full text-sm text-gray-400 hover:text-gray-600 py-2"
          >
            Skip — I will handle these manually
          </Button>
        </div>
      </div>
    </div>
  );
}