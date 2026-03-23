"use client";
// src/components/calendar/FutureTasksPanel.tsx
import type { ScheduleState } from "@/hooks/useSchedule";
import { PRIORITY_TEXT } from "@/lib/ui";
import { format } from "date-fns";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  title: string;
  priority: keyof typeof PRIORITY_TEXT;
  dueDate?: string;
  duration: number;
  completed: boolean;
  scheduledDate?: string;
}

interface FutureTasksPanelProps {
  state: ScheduleState;
  patch: (p: Partial<ScheduleState>) => void;
  futureTasks: Task[];
}

// ── Reusable task row ─────────────────────────────────────────────────────────

function TaskRow({
  task,
  selected,
  onToggle,
}: {
  task: Task;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div
      onClick={() => onToggle(task.id)}
      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
        selected
          ? "border-purple-500/40 bg-purple-500/10"
          : "border-white/[0.06] bg-white/[0.03] hover:border-white/20"
      }`}
    >
      <div
        className={`w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0 ${
          selected ? "bg-purple-500" : "border-2 border-white/20"
        }`}
      >
        {selected && (
          <span className="text-white text-[10px] font-bold">✓</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white/80 truncate">
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs font-bold ${PRIORITY_TEXT[task.priority]}`}>
            {task.priority}
          </span>
          {task.dueDate && (
            <span className="text-xs text-white/30">
              Due {format(new Date(task.dueDate), "MMM d")}
            </span>
          )}
          <span className="text-xs text-white/30">{task.duration}m</span>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FutureTasksPanel({
  state,
  patch,
  futureTasks,
}: FutureTasksPanelProps) {
  if (futureTasks.length === 0) return null;

  const toggleId = (id: string, list: string[]) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  return (
    <div className="border border-purple-500/20 rounded-2xl overflow-hidden">
      <div
        className="flex items-center justify-between p-4 bg-purple-500/10 cursor-pointer"
        onClick={() => patch({ showFutureTasks: !state.showFutureTasks })}
      >
        <div>
          <p className="text-sm font-bold text-purple-300">
            Tackle future tasks this {state.scheduleMode}?
          </p>
          <p className="text-xs text-purple-400/60 mt-0.5">
            {futureTasks.length} task{futureTasks.length !== 1 ? "s" : ""}{" "}
            beyond this period
          </p>
        </div>
        <div
          className={`w-10 h-5 rounded-full relative flex-shrink-0 transition-colors ${
            state.showFutureTasks ? "bg-purple-500" : "bg-white/10"
          }`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
              state.showFutureTasks ? "left-5" : "left-0.5"
            }`}
          />
        </div>
      </div>

      {state.showFutureTasks && (
        <div className="p-4 border-t border-purple-500/20">
          <div className="flex gap-2 mb-3">
            {(["auto", "manual"] as const).map((m) => (
              <button
                key={m}
                onClick={() => patch({ futureModeAuto: m === "auto" })}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  (state.futureModeAuto ? m === "auto" : m === "manual")
                    ? "bg-purple-500 text-white border-purple-500"
                    : "bg-white/5 text-purple-300 border-purple-500/20 hover:border-purple-400/40"
                }`}
              >
                {m === "auto" ? "✨ Auto-pick" : "✋ I'll choose"}
              </button>
            ))}
          </div>

          {state.futureModeAuto ? (
            <p className="text-xs text-white/30">
              The algorithm fills spare capacity automatically.
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-44 overflow-y-auto">
              {futureTasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  selected={state.selectedFutureTaskIds.includes(t.id)}
                  onToggle={(id) =>
                    patch({
                      selectedFutureTaskIds: toggleId(
                        id,
                        state.selectedFutureTaskIds,
                      ),
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}