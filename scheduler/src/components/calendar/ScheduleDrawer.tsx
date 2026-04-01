"use client";
// src/components/calendar/ScheduleDrawer.tsx
import { format, addDays } from "date-fns";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/Drawer";
import { PRIORITY_TEXT } from "@/lib/ui";
import type { ScheduleState } from "@/hooks/useSchedule";
import FutureTasksPanel from "./FutureTasksPanel";

interface Props {
  state: ScheduleState;
  patch: (p: Partial<ScheduleState>) => void;
  onSchedule: () => void;
  onScheduleForced: () => void;
  onClose: () => void;
}

// Reusable task row
function TaskRow({
  task,
  selected,
  onToggle,
  accent,
}: {
  task: any;
  selected: boolean;
  onToggle: (id: string) => void;
  accent: string;
}) {
  const selectedStyles =
    accent === "purple"
      ? "border-purple-500/40 bg-purple-500/10"
      : "border-indigo-500/40 bg-indigo-500/10";

  return (
    <div
      onClick={() => onToggle(task.id)}
      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
        selected ? selectedStyles : "border-white/[0.06] bg-white/[0.03] hover:border-white/20"
      }`}
    >
      <div
        className={`w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0 ${
          selected
            ? accent === "purple"
              ? "bg-purple-500"
              : "bg-indigo-500"
            : "border-2 border-white/20"
        }`}
      >
        {selected && (
          <span className="text-white text-[10px] font-bold">✓</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white/80 truncate">{task.title}</p>
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

// BreakSettings
function BreakSettings({
  state,
  patch,
}: {
  state: ScheduleState;
  patch: (p: Partial<ScheduleState>) => void;
}) {
  return (
    <div className="border border-white/[0.06] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest">
          Break Settings
        </p>
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => patch({ skipBreaks: !state.skipBreaks })}
        >
          <div className={`w-9 h-5 rounded-full relative transition-colors ${state.skipBreaks ? "bg-white" : "bg-white/10"}`}>
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full shadow transition-all ${state.skipBreaks ? "left-4 bg-gray-900" : "left-0.5 bg-white"}`}
            />
          </div>
          <span className="text-xs text-white/40">Skip breaks</span>
        </div>
      </div>
      {!state.skipBreaks && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-white/30 mb-1">Work session (mins)</p>
            <input
              type="number"
              min={15}
              max={240}
              step={5}
              value={state.breakSessionMins}
              onChange={(e) =>
                patch({ breakSessionMins: Number(e.target.value) })
              }
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div>
            <p className="text-xs text-white/30 mb-1">Break length (mins)</p>
            <input
              type="number"
              min={5}
              max={60}
              step={5}
              value={state.breakLengthMins}
              onChange={(e) =>
                patch({ breakLengthMins: Number(e.target.value) })
              }
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// WarningBanners
function WarningBanners({ state, patch, onClose, onScheduleForced }: any) {
  return (
    <>
      {state.requiresConfirmation && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
          <p className="text-sm font-bold text-amber-300 mb-1">
            ⚠️ Not all tasks fit
          </p>
          {state.overCapacityTasks.map((w: any) => (
            <p key={w.taskId} className="text-xs text-amber-400/80">
              • {w.title}
            </p>
          ))}
          <div className="flex gap-2 mt-3">
            <Button
              onClick={onScheduleForced}
              className="flex-1 bg-amber-500 text-black rounded-xl py-2 text-sm font-bold hover:bg-amber-400 transition-all"
            >
              Schedule What Fits
            </Button>
            <Button
              onClick={() =>
                patch({ requiresConfirmation: false, overCapacityTasks: [] })
              }
              className="flex-1 bg-white/5 border border-amber-500/20 text-amber-300 rounded-xl py-2 text-sm font-bold hover:bg-amber-500/10 transition-all"
            >
              Go Back
            </Button>
          </div>
        </div>
      )}
      {state.missedDeadlineTasks.length > 0 && !state.requiresConfirmation && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
          <p className="text-sm font-bold text-red-400 mb-2">
            ⚠️ Couldn&apos;t meet deadlines
          </p>
          {state.missedDeadlineTasks.map((w: any) => (
            <p key={w.taskId} className="text-xs text-red-400/70">• {w.title}</p>
          ))}
          <Button
            onClick={onClose}
            className="mt-3 w-full bg-red-500 text-white rounded-xl py-2 text-sm font-bold hover:bg-red-400 transition-all"
          >
            Close
          </Button>
        </div>
      )}
    </>
  );
}

// Constants
const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toggleId = (id: string, list: string[]) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

const d0 = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Main component
export default function ScheduleDrawer({
  state,
  patch,
  onSchedule,
  onScheduleForced,
  onClose,
}: Props) {
  const ws = new Date(state.scheduleWeekStart + "T12:00:00");
  const we = addDays(ws, 6);

  const allDays =
    state.scheduleMode === "day"
      ? [format(new Date(state.scheduleDate + "T12:00:00"), "yyyy-MM-dd")]
      : Array.from({ length: 7 }, (_, i) =>
          format(addDays(ws, i), "yyyy-MM-dd"),
        );

  const source = state.scheduleDialogTasks;
  const weekTasks = source.filter(
    (t) =>
      !t.completed &&
      t.scheduledDate &&
      d0(new Date(t.scheduledDate)) >= d0(ws) &&
      d0(new Date(t.scheduledDate)) <= d0(we),
  );
  const unscheduled = source.filter((t) => !t.completed && !t.scheduledDate);
  const weekIdSet = new Set(weekTasks.map((t) => t.id));
  const futureTasks = source.filter(
    (t) =>
      !t.completed &&
      !weekIdSet.has(t.id) &&
      t.scheduledDate &&
      d0(new Date(t.scheduledDate)) > d0(we),
  );

  return (
    <Drawer
      open={state.showScheduleDialog}
      onOpenChange={onClose}
      direction="bottom"
    >
      <DrawerContent className="max-h-[92vh] flex flex-col bg-[#111118] border-t border-white/[0.07]">
        <DrawerHeader className="border-b border-white/[0.06] px-6 pt-4 pb-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DrawerTitle className="text-xl font-black text-white">
                {state.scheduleMode === "day"
                  ? "Schedule My Day"
                  : "Schedule My Week"}
              </DrawerTitle>
              <DrawerDescription className="text-sm text-white/30 mt-0.5">
                {state.scheduleMode === "day"
                  ? format(
                      new Date(state.scheduleDate + "T12:00:00"),
                      "EEEE, MMM d, yyyy",
                    )
                  : `${format(ws, "MMM d")} – ${format(we, "MMM d, yyyy")}`}
              </DrawerDescription>
            </div>
            <DrawerClose
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white/70 text-sm transition-all"
            >
              ✕
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <div>
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-2">
              {state.scheduleMode === "day" ? "Day" : "Week Starting"}
            </p>
            <input
              type="date"
              value={
                state.scheduleMode === "day"
                  ? state.scheduleDate
                  : state.scheduleWeekStart
              }
              onChange={(e) =>
                patch({
                  requiresConfirmation: false,
                  overCapacityTasks: [],
                  missedDeadlineTasks: [],
                  showFutureTasks: false,
                  selectedFutureTaskIds: [],
                  unavailableDays: [],
                  ...(state.scheduleMode === "day"
                    ? { scheduleDate: e.target.value }
                    : { scheduleWeekStart: e.target.value }),
                })
              }
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4">
            <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mb-2">
              Scheduled this {state.scheduleMode}
            </p>
            {weekTasks.length === 0 ? (
              <p className="text-sm text-indigo-400/50"> No tasks scheduled yet for this period. </p>
            ) : (
              weekTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-indigo-500/50 flex-shrink-0" />
                  <span className="text-xs text-indigo-300 flex-1 truncate">
                    {t.title}
                  </span>
                  <span className="text-xs text-indigo-400/50 flex-shrink-0">
                    {t.duration}m
                  </span>
                </div>
              ))
            )}
          </div>

          {unscheduled.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-2">
                Add unscheduled tasks
              </p>
              <div className="flex flex-col gap-2 max-h-44 overflow-y-auto">
                {unscheduled.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    accent="indigo"
                    selected={state.selectedTaskIds.includes(t.id)}
                    onToggle={(id) =>
                      patch({ selectedTaskIds: toggleId(id, state.selectedTaskIds), })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {state.scheduleMode === "week" && (
            <div>
              <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-2">
                Days you&apos;re unavailable
              </p>
              <div className="flex gap-2 flex-wrap">
                {allDays.map((d) => {
                  const isOff = state.unavailableDays.includes(d);
                  const dd = new Date(d + "T12:00:00");
                  return (
                    <Button
                      key={d}
                      onClick={() => patch({ unavailableDays: toggleId(d, state.unavailableDays), })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isOff
                          ? "bg-red-500/10 border-red-500/30 text-red-400"
                          : "bg-white/5 border-white/10 text-white/40 hover:border-white/25 hover:text-white/60"
                      }`}
                    >
                      {DAY_ABBR[dd.getDay()]} {format(dd, "d")}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <FutureTasksPanel
            state={state}
            patch={patch}
            futureTasks={futureTasks}
          />
          <BreakSettings state={state} patch={patch} />
          <WarningBanners
            state={state}
            patch={patch}
            onClose={onClose}
            onScheduleForced={onScheduleForced}
          />
        </div>

        {!state.requiresConfirmation &&
          state.missedDeadlineTasks.length === 0 && (
            <DrawerFooter className="border-t border-white/[0.06] px-6 py-4 flex-shrink-0">
              <Button
                onClick={onSchedule}
                disabled={state.isScheduling}
                className="w-full bg-white text-gray-900 rounded-2xl py-4 text-sm font-bold hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {state.isScheduling ? "Scheduling…" : "Create Schedule"}
              </Button>
            </DrawerFooter>
          )}
      </DrawerContent>
    </Drawer>
  );
}