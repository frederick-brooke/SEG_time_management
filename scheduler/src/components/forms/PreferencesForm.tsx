/**
 * @file preferences-form.tsx
 * @description Controlled form component for loading and persisting
 * user scheduling preferences via the /api/preferences endpoint.
 */

"use client";

import { useState, useEffect } from "react";

// Types 

interface Preferences {
  workStartTime: string;
  workEndTime: string;
  daysOff: string[];
  sessionLength: number;
  breakLength: number;
  breaksPerDay: number;
  taskOrder: string;
  maxTasksPerDay: number;
  defaultTaskDuration: number;
  reminderDays: number;
}

interface PreferencesFormProps {
  userId: string;
  onSaved?: () => void;
}

// Constants 

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TASK_ORDER_OPTIONS = [
  { value: "hard-first",     label: "Hard first",     desc: "High priority tasks scheduled early" },
  { value: "easy-first",     label: "Easy first",     desc: "Warm up with shorter tasks" },
  { value: "deadline",       label: "Deadline first", desc: "Tasks closest to due date go first" },
  { value: "duration_asc",   label: "Shortest first", desc: "Quick wins early in the day" },
  { value: "duration_desc",  label: "Longest first",  desc: "Big tasks while energy is high" },
];

const DEFAULT_PREFERENCES: Preferences = {
  workStartTime: "09:00",
  workEndTime: "17:00",
  daysOff: [],
  sessionLength: 90,
  breakLength: 15,
  breaksPerDay: 3,
  taskOrder: "hard-first",
  maxTasksPerDay: 8,
  defaultTaskDuration: 60,
  reminderDays: 2,
};

// Pure Utilities 

/**
 * Calculates total working minutes between two HH:mm time strings.
 * @param start - Work start time in "HH:mm" format.
 * @param end - Work end time in "HH:mm" format.
 * @returns Total working minutes, floored at 0.
 */
function calcWorkingMins(start: string, end: string): number {
  const toMins = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  return Math.max(0, toMins(end) - toMins(start));
}

/**
 * Fetches and normalises user preferences from the API.
 * @param userId - The authenticated user's ID.
 * @returns Merged preferences with defaults for any missing fields.
 * @throws {Error} On non-OK HTTP response.
 */
async function fetchPreferences(userId: string): Promise<Preferences> {
  const res = await fetch(`/api/preferences?userId=${userId}`);
  if (!res.ok) throw new Error(`Failed to load preferences: ${res.status}`);
  const { preferences } = await res.json();
  return { ...DEFAULT_PREFERENCES, ...preferences };
}

/**
 * Persists user preferences to the API.
 * @param userId - The authenticated user's ID.
 * @param prefs - The full preferences payload to save.
 * @throws {Error} On non-OK HTTP response.
 */
async function savePreferences(userId: string, prefs: Preferences): Promise<void> {
  const res = await fetch("/api/preferences", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...prefs }),
  });
  if (!res.ok) throw new Error("Failed to save preferences.");
}

// Sub-components 

/**
 * Renders a labelled range slider with tick marks.
 * @param label - The field label shown above the slider.
 * @param value - The current numeric value.
 * @param min - Minimum slider value.
 * @param max - Maximum slider value.
 * @param step - Step increment.
 * @param ticks - Tick labels shown below the slider.
 * @param onChange - Fired with the new numeric value on change.
 */
function RangeField({ label, value, min, max, step, ticks, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  ticks: string[];
  onChange: (val: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-gray-400 uppercase">{label}</label>
        <span className="text-sm font-bold text-indigo-600">{value} min</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-indigo-600"
      />
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        {ticks.map((t) => <span key={t}>{t}</span>)}
      </div>
    </div>
  );
}

/**
 * Renders the Work Hours section of the preferences form.
 * @param prefs - The current preferences state.
 * @param onChange - Generic field change handler.
 */
function WorkHoursSection({ prefs, onChange }: {
  prefs: Preferences;
  onChange: <K extends keyof Preferences>(field: K, value: Preferences[K]) => void;
}) {
  const workingMins = calcWorkingMins(prefs.workStartTime, prefs.workEndTime);

  const onToggleDay = (day: string) => {
    const updated = prefs.daysOff.includes(day)
      ? prefs.daysOff.filter((d) => d !== day)
      : [...prefs.daysOff, day];
    onChange("daysOff", updated);
  };

  return (
    <section className="bg-white rounded-2xl border p-6 flex flex-col gap-5">
      <h3 className="font-black text-gray-900">Work Hours</h3>
      <div className="grid grid-cols-2 gap-4">
        {(["workStartTime", "workEndTime"] as const).map((field) => (
          <div key={field}>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">
              {field === "workStartTime" ? "Start time" : "End time"}
            </label>
            <input
              type="time" value={prefs[field]}
              onChange={(e) => onChange(field, e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
        ))}
      </div>
      {workingMins > 0 && (
        <p className="text-xs text-indigo-600 font-medium">
          {Math.floor(workingMins / 60)}h {workingMins % 60 > 0 ? `${workingMins % 60}m` : ""} working window
        </p>
      )}
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Days off</label>
        <div className="flex gap-2">
          {DAYS.map((day) => (
            <Button key={day} type="button" onClick={() => onToggleDay(day)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                prefs.daysOff.includes(day)
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >{day}</Button>
          ))}
        </div>
        {prefs.daysOff.length > 0 && (
          <p className="text-xs text-red-500 font-medium mt-2">Off: {prefs.daysOff.join(", ")}</p>
        )}
      </div>
    </section>
  );
}

/**
 * Renders the Sessions & Breaks section of the preferences form.
 * @param prefs - The current preferences state.
 * @param onChange - Generic field change handler.
 */
function SessionsSection({ prefs, onChange }: {
  prefs: Preferences;
  onChange: <K extends keyof Preferences>(field: K, value: Preferences[K]) => void;
}) {
  return (
    <section className="bg-white rounded-2xl border p-6 flex flex-col gap-5">
      <h3 className="font-black text-gray-900">Sessions & Breaks</h3>
      <RangeField
        label="Work session length" value={prefs.sessionLength}
        min={15} max={180} step={15} ticks={["15m", "1h", "2h", "3h"]}
        onChange={(val) => onChange("sessionLength", val)}
      />
      <RangeField
        label="Break length" value={prefs.breakLength}
        min={5} max={60} step={5} ticks={["5m", "15m", "30m", "60m"]}
        onChange={(val) => onChange("breakLength", val)}
      />
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Breaks per day</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Button key={n} type="button" onClick={() => onChange("breaksPerDay", n)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                prefs.breaksPerDay === n
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >{n}</Button>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Renders the Task Preferences section of the preferences form.
 * @param prefs - The current preferences state.
 * @param onChange - Generic field change handler.
 */
function TaskSection({ prefs, onChange }: {
  prefs: Preferences;
  onChange: <K extends keyof Preferences>(field: K, value: Preferences[K]) => void;
}) {
  return (
    <section className="bg-white rounded-2xl border p-6 flex flex-col gap-5">
      <h3 className="font-black text-gray-900">Task Preferences</h3>
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Task ordering</label>
        <div className="flex flex-col gap-2">
          {TASK_ORDER_OPTIONS.map(({ value, label, desc }) => (
            <label key={value}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                prefs.taskOrder === value ? "border-indigo-400 bg-indigo-50" : "border-gray-100 hover:border-gray-300"
              }`}
            >
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-all ${
                prefs.taskOrder === value ? "border-indigo-600 bg-indigo-600" : "border-gray-300"
              }`}>
                {prefs.taskOrder === value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <input type="radio" className="hidden" name="taskOrder" value={value}
                checked={prefs.taskOrder === value}
                onChange={(e) => onChange("taskOrder", e.target.value)}
                aria-label={label}
              />
              <div>
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Max tasks per day</label>
          <input type="number" value={prefs.maxTasksPerDay} min="1" max="20"
            onChange={(e) => onChange("maxTasksPerDay", parseInt(e.target.value))}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Default duration</label>
          <div className="relative">
            <input type="number" value={prefs.defaultTaskDuration} min="15" max="240"
              onChange={(e) => onChange("defaultTaskDuration", parseInt(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">min</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Renders the Reminders section of the preferences form.
 * @param reminderDays - The currently selected reminder lead time in days.
 * @param onChange - Fired with the new value on selection.
 */
function RemindersSection({ reminderDays, onChange }: {
  reminderDays: number;
  onChange: (val: number) => void;
}) {
  return (
    <section className="bg-white rounded-2xl border p-6 flex flex-col gap-4">
      <h3 className="font-black text-gray-900">Reminders</h3>
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Remind me before deadlines</label>
        <div className="flex gap-2 flex-wrap">
          {[0, 1, 2, 3, 5, 7, 14].map((n) => (
            <Button key={n} type="button" onClick={() => onChange(n)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                reminderDays === n
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              }`}
            >{n === 0 ? "Day of" : `${n}d before`}</Button>
          ))}
        </div>
      </div>
    </section>
  );
}

// Root Component 

/**
 * Loads and persists user scheduling preferences.
 * Delegates rendering to section sub-components and API calls to pure utilities.
 * @param userId - The authenticated user's ID.
 * @param onSaved - Optional callback fired after a successful save.
 */
export default function PreferencesForm({ userId, onSaved }: PreferencesFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    fetchPreferences(userId)
      .then(setPrefs)
      .catch((err) => {
        console.error("Failed to load preferences:", err);
        setError("Failed to load preferences.");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const onChange = <K extends keyof Preferences>(field: K, value: Preferences[K]) =>
    setPrefs((prev) => ({ ...prev, [field]: value }));

  const onSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await savePreferences(userId, prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onSaved?.();
      } catch {
        window.alert("Failed to save preferences. Please try again.");
        setError("Failed to save preferences. Please try again.");
      }finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div data-testid="loading-spinner" className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
      <WorkHoursSection prefs={prefs} onChange={onChange} />
      <SessionsSection prefs={prefs} onChange={onChange} />
      <TaskSection prefs={prefs} onChange={onChange} />
      <RemindersSection reminderDays={prefs.reminderDays} onChange={(val) => onChange("reminderDays", val)} />
      <div className="flex items-center gap-4">
        <Button onClick={onSave} disabled={saving}
          className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save Preferences"}
        </Button>
        {saved && (
          <span className="text-sm text-green-600 font-semibold flex items-center gap-1.5">
            <span className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center text-[10px]">✓</span>
            Saved successfully
          </span>
        )}
      </div>
    </div>
  );
}