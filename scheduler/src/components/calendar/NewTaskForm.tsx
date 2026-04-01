"use client";
// src/components/calendar/NewTaskForm.tsx
import { useState } from "react";
import { Toggle, RecurrencePanel } from "@/components/shared/FormComponents";
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
// NewTaskForm
// ---------------------------------------------------------------------------
export function NewTaskForm({ eventStartDate, defaultUntil, onAdd }: any) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("60");
  const [priority, setPriority] = useState("Medium");
  const [mode, setMode] = useState<RelativeOption>("1-before");
  const [customDate, setCustomDate] = useState(eventStartDate);
  const [useRange, setUseRange] = useState(false);
  const [rangeStart, setRangeStart] = useState(eventStartDate);
  const [rangeEnd, setRangeEnd] = useState(eventStartDate);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recType, setRecType] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [recDays, setRecDays] = useState<string[]>([]);
  const [recUntil, setRecUntil] = useState(defaultUntil);
  const [scheduleTime, setScheduleTime] = useState(false);
  const [specificTime, setSpecificTime] = useState("09:00");

  const inputClass =
    "w-full bg-white/5 border border-white/10 text-white placeholder-white/20 p-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors";

  const reset = () => {
    setTitle("");
    setDuration("60");
    setPriority("Medium");
    setMode("1-before");
    setIsRecurring(false);
    setRecDays([]);
    setScheduleTime(false);
    setSpecificTime("09:00");
  };

  const handleAdd = () => {
    if (!title.trim()) return;
    const config = RELATIVE_OPTIONS.find((o) => o.key === mode)!;
    onAdd({
      title,
      duration: parseInt(duration) || 60,
      priority,
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
    reset();
  };

  return (
    <div className="border border-dashed border-white/10 rounded-2xl p-4 flex flex-col gap-3">
      <p className="text-xs font-bold text-white/30 uppercase">Add a task</p>
      <input
        type="text"
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-white/30">Duration (mins)</label>
          <input
            type="number"
            value={duration}
            min="5"
            step="5"
            onChange={(e) => setDuration(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </div>
        <div>
          <label className="text-xs font-bold text-white/30">Priority</label>
          <div className="relative mt-1">
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={`${inputClass} appearance-none cursor-pointer pr-8`}
            >
              <option value="Low" className="bg-[#1a1a24]">Low</option>
              <option value="Medium" className="bg-[#1a1a24]">Medium</option>
              <option value="High" className="bg-[#1a1a24]">High</option>
            </Select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">▼</span>
          </div>
        </div>
      </div>
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
          onToggle={() => setScheduleTime((p) => !p)}
          label="Schedule for a specific time?"
        />
        {scheduleTime ? (
          <input
            type="time"
            value={specificTime}
            onChange={(e) => setSpecificTime(e.target.value)}
            className={inputClass}
          />
        ) : (
          <p className="text-xs text-white/30">
            Task will appear in Unscheduled Tasks — you can place it later.
          </p>
        )}
      </div>
      <div className="border-t border-white/[0.06] pt-3">
        <Toggle
          on={isRecurring}
          onToggle={() => setIsRecurring((p) => !p)}
          label={isRecurring ? "Repeating task" : "One-time task"}
        />
        {isRecurring && (
          <div className="mt-2">
            <RecurrencePanel
              type={recType}
              days={recDays}
              until={recUntil}
              onType={(t) => setRecType(t as any)}
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
      <Button
        type="button"
        onClick={handleAdd}
        className="w-full bg-indigo-600 text-white py-2 rounded-xl font-bold text-sm hover:bg-indigo-500 transition-all"
      >
        + Add Task
      </Button>
    </div>
  );
}