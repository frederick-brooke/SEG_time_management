"use client";
// src/components/calendar/EventFormParts.tsx
import { useState, useEffect } from "react";
import { Toggle, RecurrencePanel } from "@/components/shared/FormComponents";
import { PRIORITY_TEXT } from "@/lib/ui";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
type RelativeOption =
  | "3-before"
  | "2-before"
  | "1-before"
  | "same-day"
  | "1-after"
  | "2-after"
  | "3-after"
  | "custom";

export const RELATIVE_OPTIONS: {
  key: RelativeOption;
  label: string;
  offsetDays: number | null;
}[] = [
  { key: "3-before", label: "3 days before", offsetDays: -3 },
  { key: "2-before", label: "2 days before", offsetDays: -2 },
  { key: "1-before", label: "1 day before", offsetDays: -1 },
  { key: "same-day", label: "Same day", offsetDays: 0 },
  { key: "1-after", label: "1 day after", offsetDays: 1 },
  { key: "2-after", label: "2 days after", offsetDays: 2 },
  { key: "3-after", label: "3 days after", offsetDays: 3 },
  { key: "custom", label: "Custom date", offsetDays: null },
];

function relativeTo(mode: RelativeOption) {
  if (mode === "custom") return "custom";
  if (mode === "same-day") return "during";
  if (mode.includes("before")) return "before";
  return "after";
}

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
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all text-left ${
            value === opt.key
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
          }`}
        >
          {opt.label}
        </button>
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
    <div className="p-3 bg-white rounded-xl border border-indigo-100 flex flex-col gap-2">
      <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
        <input
          type="checkbox"
          checked={useRange}
          onChange={(e) => setUseRange(e.target.checked)}
        />
        <span>Use a date range</span>
      </label>
      {useRange ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-400">From</label>
            <input
              type="date"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              className="w-full border p-2 rounded-lg text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">To</label>{" "}
            <input
              type="date"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              className="w-full border p-2 rounded-lg text-sm mt-1"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="text-xs text-gray-400">Date</label>
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="w-full border p-2 rounded-lg text-sm mt-1"
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
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
      <div className="flex items-center gap-3 p-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 truncate">
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-gray-400">{task.duration}m</span>
            <span
              className={`text-xs font-bold ${PRIORITY_TEXT[task.priority]}`}
            >
              {task.priority}
            </span>
            <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium">
              {config.label}
            </span>
            {scheduleTime && (
              <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-medium">
                ⏰ {specificTime}
              </span>
            )}
            {isRecurring && (
              <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-medium">
                🔁
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setExpanded((p) => !p)}
          className="text-xs text-gray-400 hover:text-gray-700 px-2"
        >
          {expanded ? "▲" : "▼"}
        </button>
        <button
          onClick={() => onRemove(index)}
          className="text-red-400 hover:text-red-600 text-lg leading-none"
        >
          ✕
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-3 flex flex-col gap-3 bg-gray-50">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">
              Schedule relative to event
            </label>
            <RelativePicker value={mode} onChange={setMode} />
          </div>
          {mode === "custom" && (
            <CustomDatePicker
              {...{
                useRange,
                setUseRange,
                customDate,
                setCustomDate,
                rangeStart,
                setRangeStart,
                rangeEnd,
                setRangeEnd,
              }}
            />
          )}
          <div className="p-3 bg-white rounded-xl border border-gray-100 flex flex-col gap-2">
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
                className="w-full border p-2 rounded-lg text-sm"
              />
            ) : (
              <p className="text-xs text-gray-400">
                Task will appear in Unscheduled Tasks until you schedule it.
              </p>
            )}
          </div>
          <div className="border-t pt-3">
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

// ---------------------------------------------------------------------------
// NewTaskForm — the add-a-task input at the bottom of TaskPromptSection
// ---------------------------------------------------------------------------
function NewTaskForm({ eventStartDate, defaultUntil, onAdd }: any) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("60");
  const [priority, setPriority] = useState("Medium");
  const [mode, setMode] = useState<RelativeOption>("1-before");
  const [customDate, setCustomDate] = useState(eventStartDate);
  const [useRange, setUseRange] = useState(false);
  const [rangeStart, setRangeStart] = useState(eventStartDate);
  const [rangeEnd, setRangeEnd] = useState(eventStartDate);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recType, setRecType] = useState<"daily" | "weekly" | "monthly">(
    "weekly",
  );
  const [recDays, setRecDays] = useState<string[]>([]);
  const [recUntil, setRecUntil] = useState(defaultUntil);
  const [scheduleTime, setScheduleTime] = useState(false);
  const [specificTime, setSpecificTime] = useState("09:00");

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
    <div className="border border-dashed border-gray-300 rounded-2xl p-4 flex flex-col gap-3">
      <p className="text-xs font-bold text-gray-400 uppercase">Add a task</p>
      <input
        type="text"
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        className="border p-2 rounded-lg text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-bold text-gray-400">
            Duration (mins)
          </label>
          <input
            type="number"
            value={duration}
            min="5"
            step="5"
            onChange={(e) => setDuration(e.target.value)}
            className="w-full border p-2 rounded-lg text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full border p-2 rounded-lg text-sm mt-1"
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">
          Schedule relative to event
        </label>
        <RelativePicker value={mode} onChange={setMode} />
      </div>
      {mode === "custom" && (
        <CustomDatePicker
          {...{
            useRange,
            setUseRange,
            customDate,
            setCustomDate,
            rangeStart,
            setRangeStart,
            rangeEnd,
            setRangeEnd,
          }}
        />
      )}
      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-2">
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
            className="w-full border p-2 rounded-lg text-sm"
          />
        ) : (
          <p className="text-xs text-gray-400">
            Task will appear in Unscheduled Tasks — you can place it later.
          </p>
        )}
      </div>
      <div className="border-t pt-3">
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
      <button
        type="button"
        onClick={handleAdd}
        className="w-full bg-indigo-600 text-white py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
      >
        + Add Task
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TaskPromptSection
// ---------------------------------------------------------------------------
interface TaskPromptSectionProps {
  createdEventId: string;
  userId: string;
  eventStartDate: string;
  defaultUntil: string;
  onFinish: () => void;
}

export function TaskPromptSection({
  createdEventId,
  userId,
  eventStartDate,
  defaultUntil,
  onFinish,
}: TaskPromptSectionProps) {
  const [linkedTasks, setLinkedTasks] = useState<any[]>([]);

  const handleAdd = (task: any) =>
    setLinkedTasks((prev) => [
      ...prev,
      { ...task, userId, eventId: createdEventId },
    ]);

  const handleSave = async () => {
    if (linkedTasks.length > 0) {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: linkedTasks }),
      });
      window.dispatchEvent(new Event("tasks-updated"));
    }
    onFinish();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-indigo-50 p-4 rounded-xl">
        <h3 className="font-bold text-gray-900 mb-1">
          Link tasks to this event?
        </h3>
        <p className="text-sm text-gray-500">
          Tasks will be scheduled relative to each occurrence, or left
          unscheduled for you to place manually.
        </p>
      </div>

      {linkedTasks.length > 0 && (
        <div className="flex flex-col gap-2">
          {linkedTasks.map((t, i) => (
            <LinkedTaskCard
              key={i}
              task={t}
              index={i}
              eventStartDate={eventStartDate}
              onUpdate={(idx: number, updated: any) =>
                setLinkedTasks((prev) =>
                  prev.map((item, j) => (j === idx ? updated : item)),
                )
              }
              onRemove={(idx: number) =>
                setLinkedTasks((prev) => prev.filter((_, j) => j !== idx))
              }
            />
          ))}
        </div>
      )}

      <NewTaskForm
        eventStartDate={eventStartDate}
        defaultUntil={defaultUntil}
        onAdd={handleAdd}
      />

      <button
        onClick={handleSave}
        className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all"
      >
        {linkedTasks.length > 0 ? "Save Tasks & Finish" : "Skip — No Tasks"}
      </button>
    </div>
  );
}
