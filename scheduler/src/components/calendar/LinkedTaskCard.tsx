"use client";
// src/components/calendar/LinkedTaskCard.tsx
import { useState, useEffect } from "react";
import { Toggle, RecurrencePanel } from "@/components/shared/FormComponents";
import { PRIORITY_TEXT } from "@/lib/ui";
import { RELATIVE_OPTIONS, RelativeOption, relativeTo } from "./EventFormParts";

// ---------------------------------------------------------------------------
// RelativePicker — grid of relative option buttons
// ---------------------------------------------------------------------------
function RelativePicker({
  value,
  onChange,
}: {
  value: RelativeOption;
  onChange: (v: RelativeOption) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {RELATIVE_OPTIONS.map((opt) => (
        <Button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all text-left ${
            value === opt.key
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white/5 text-white/50 border-white/10 hover:border-indigo-500/50 hover:text-white/80"
          }`}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CustomDatePicker — single date or date range
// ---------------------------------------------------------------------------
function CustomDatePicker({
  useRange,
  setUseRange,
  customDate,
  setCustomDate,
  rangeStart,
  setRangeStart,
  rangeEnd,
  setRangeEnd,
}: any) {
  return (
    <div className="p-3 bg-white/5 rounded-xl border border-indigo-500/20 flex flex-col gap-2">
      <label className="flex items-center gap-2 cursor-pointer text-xs text-white/50">
        <input
          type="checkbox"
          checked={useRange}
          onChange={(e) => setUseRange(e.target.checked)}
          className="accent-indigo-500"
        />
        <span>Use a date range</span>
      </label>
      {useRange ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-white/30">From</label>
            <input
              type="date"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white p-2 rounded-lg text-sm mt-1 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-white/30">To</label>
            <input
              type="date"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white p-2 rounded-lg text-sm mt-1 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="text-xs text-white/30">Date</label>
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white p-2 rounded-lg text-sm mt-1 focus:outline-none focus:border-indigo-500"
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LinkedTaskCard
// ---------------------------------------------------------------------------
export function LinkedTaskCard({
  task,
  index,
  eventStartDate,
  onUpdate,
  onRemove,
}: any) {
  const [mode, setMode] = useState<RelativeOption>(
    task.relativeMode ?? "1-before",
  );
  const [customDate, setCustomDate] = useState(
    task.customDate ?? eventStartDate,
  );
  const [useRange, setUseRange] = useState(task.useRange ?? false);
  const [rangeStart, setRangeStart] = useState(
    task.customRangeStart ?? eventStartDate,
  );
  const [rangeEnd, setRangeEnd] = useState(
    task.customRangeEnd ?? eventStartDate,
  );
  const [isRecurring, setIsRecurring] = useState(task.isRecurring ?? false);
  const [recType, setRecType] = useState(task.recurrence?.type ?? "weekly");
  const [recDays, setRecDays] = useState<string[]>(task.recurrence?.days ?? []);
  const [recUntil, setRecUntil] = useState(task.recurrence?.until ?? "");
  const [scheduleTime, setScheduleTime] = useState(task.scheduleTime ?? false);
  const [specificTime, setSpecificTime] = useState(
    task.specificTime ?? "09:00",
  );
  const [expanded, setExpanded] = useState(false);

  const config = RELATIVE_OPTIONS.find((o) => o.key === mode)!;

  useEffect(() => {
    onUpdate(index, {
      ...task,
      relativeMode: mode,
      scheduledRelativeTo: relativeTo(mode),
      relativeOffsetDays: config.offsetDays,
      customDate: mode === "custom" && !useRange ? customDate : null,
      customRangeStart: mode === "custom" && useRange ? rangeStart : null,
      customRangeEnd: mode === "custom" && useRange ? rangeEnd : null,
      useRange,
      isRecurring,
      recurrence: isRecurring
        ? {
            type: recType,
            days: recType === "weekly" ? recDays : [],
            until: recUntil || null,
          }
        : null,
      scheduleTime,
      specificTime: scheduleTime ? specificTime : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mode,
    customDate,
    useRange,
    rangeStart,
    rangeEnd,
    isRecurring,
    recType,
    recDays,
    recUntil,
    scheduleTime,
    specificTime,
  ]);

  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.03]">
      <div className="flex items-center gap-3 p-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{task.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-white/30">{task.duration}m</span>
            <span className={`text-xs font-bold ${PRIORITY_TEXT[task.priority]}`}>
              {task.priority}
            </span>
            <span className="text-xs bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded-full font-medium">
              {config.label}
            </span>
            {scheduleTime && (
              <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-medium">
                ⏰ {specificTime}
              </span>
            )}
            {isRecurring && (
              <span className="text-xs bg-purple-500/15 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded-full font-medium">
                🔁
              </span>
            )}
          </div>
        </div>
        <Button
          onClick={() => setExpanded((p) => !p)}
          className="text-xs text-white/30 hover:text-white/70 px-2 transition-colors"
        >
          {expanded ? "▲" : "▼"}
        </Button>
        <Button
          onClick={() => onRemove(index)}
          className="text-red-400/60 hover:text-red-400 text-lg leading-none transition-colors"
        >
          ✕
        </Button>
      </div>

      {expanded && (
        <div className="border-t border-white/[0.06] p-3 flex flex-col gap-3 bg-black/20">
          <div>
            <label className="text-xs font-bold text-white/30 uppercase mb-1.5 block">
              Schedule relative to event
            </label>
            <RelativePicker value={mode} onChange={setMode} />
          </div>
          {mode === "custom" && (
            <CustomDatePicker
              {...{ useRange, setUseRange, customDate, setCustomDate, rangeStart, setRangeStart, rangeEnd, setRangeEnd }}
            />
          )}
          <div className="p-3 bg-white/5 rounded-xl border border-white/[0.07] flex flex-col gap-2">
            <Toggle
              on={scheduleTime}
              onToggle={() => setScheduleTime((p: boolean) => !p)}
              label="Schedule for a specific time?"
            />
            {scheduleTime ? (
              <input
                type="time"
                value={specificTime}
                onChange={(e) => setSpecificTime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white p-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
            ) : (
              <p className="text-xs text-white/30">
                Task will appear in Unscheduled Tasks until you schedule it.
              </p>
            )}
          </div>
          <div className="border-t border-white/[0.06] pt-3">
            <Toggle
              on={isRecurring}
              onToggle={() => setIsRecurring((p: boolean) => !p)}
              label={isRecurring ? "Repeating task" : "One-time task"}
            />
            {isRecurring && (
              <div className="mt-2">
                <RecurrencePanel
                  type={recType}
                  days={recDays}
                  until={recUntil}
                  onType={setRecType}
                  onDays={setRecDays}
                  onUntil={setRecUntil}
                  options={[
                    { value: "daily", label: "Daily" },
                    { value: "weekly", label: "Weekly (with event)" },
                    { value: "monthly", label: "Monthly" },
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}