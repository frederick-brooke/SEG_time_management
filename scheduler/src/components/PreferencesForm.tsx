"use client";
import { useState, useEffect } from "react";

const DAYS = [
  { label: "Mon", abbr: "Mon" },
  { label: "Tue", abbr: "Tue" },
  { label: "Wed", abbr: "Wed" },
  { label: "Thu", abbr: "Thu" },
  { label: "Fri", abbr: "Fri" },
  { label: "Sat", abbr: "Sat" },
  { label: "Sun", abbr: "Sun" },
];

interface PreferencesFormProps {
  userId: string;
  onSaved?: () => void;
}

export default function PreferencesForm({
  userId,
  onSaved,
}: PreferencesFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    workStartTime: "09:00",
    workEndTime: "17:00",
    daysOff: [] as string[],
    sessionLength: 90,
    breakLength: 15,
    breaksPerDay: 3,
    taskOrder: "hard-first",
    maxTasksPerDay: 8,
    defaultTaskDuration: 60,
    reminderDays: 2,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/preferences?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.preferences) {
            setFormData({
              workStartTime: data.preferences.workStartTime ?? "09:00",
              workEndTime: data.preferences.workEndTime ?? "17:00",
              daysOff: data.preferences.daysOff ?? [],
              sessionLength: data.preferences.sessionLength ?? 90,
              breakLength: data.preferences.breakLength ?? 15,
              breaksPerDay: data.preferences.breaksPerDay ?? 3,
              taskOrder: data.preferences.taskOrder ?? "hard-first",
              maxTasksPerDay: data.preferences.maxTasksPerDay ?? 8,
              defaultTaskDuration: data.preferences.defaultTaskDuration ?? 60,
              reminderDays: data.preferences.reminderDays ?? 2,
            });
          }
        }
      } catch (e) {
        console.error("Failed to load preferences:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleChange = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID: userId, ...formData }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onSaved?.();
    } catch (e) {
      alert("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Compute working window in hours
  const workingMins = (() => {
    const [sh, sm] = formData.workStartTime.split(":").map(Number);
    const [eh, em] = formData.workEndTime.split(":").map(Number);
    return Math.max(0, eh * 60 + em - (sh * 60 + sm));
  })();

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* ── Work Hours ── */}
      <section className="bg-white rounded-2xl border p-6 flex flex-col gap-5">
        <h3 className="font-black text-gray-900">Work Hours</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">
              Start time
            </label>
            <input
              type="time"
              value={formData.workStartTime}
              onChange={(e) => handleChange("workStartTime", e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">
              End time
            </label>
            <input
              type="time"
              value={formData.workEndTime}
              onChange={(e) => handleChange("workEndTime", e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        {workingMins > 0 && (
          <p className="text-xs text-indigo-600 font-medium">
            {Math.floor(workingMins / 60)}h{" "}
            {workingMins % 60 > 0 ? `${workingMins % 60}m` : ""} working window
          </p>
        )}

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
            Days off
          </label>
          <div className="flex gap-2">
            {DAYS.map(({ label, abbr }) => {
              const on = formData.daysOff.includes(abbr);
              return (
                <button
                  key={abbr}
                  type="button"
                  onClick={() =>
                    handleChange(
                      "daysOff",
                      on
                        ? formData.daysOff.filter((d) => d !== abbr)
                        : [...formData.daysOff, abbr],
                    )
                  }
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${on ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {formData.daysOff.length > 0 && (
            <p className="text-xs text-red-500 font-medium mt-2">
              Off: {formData.daysOff.join(", ")}
            </p>
          )}
        </div>
      </section>

      {/* ── Sessions & Breaks ── */}
      <section className="bg-white rounded-2xl border p-6 flex flex-col gap-5">
        <h3 className="font-black text-gray-900">Sessions & Breaks</h3>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-gray-400 uppercase">
              Work session length
            </label>
            <span className="text-sm font-bold text-indigo-600">
              {formData.sessionLength} min
            </span>
          </div>
          <input
            type="range"
            min="15"
            max="180"
            step="15"
            value={formData.sessionLength}
            onChange={(e) =>
              handleChange("sessionLength", parseInt(e.target.value))
            }
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>15m</span>
            <span>1h</span>
            <span>2h</span>
            <span>3h</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-gray-400 uppercase">
              Break length
            </label>
            <span className="text-sm font-bold text-indigo-600">
              {formData.breakLength} min
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="60"
            step="5"
            value={formData.breakLength}
            onChange={(e) =>
              handleChange("breakLength", parseInt(e.target.value))
            }
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>5m</span>
            <span>15m</span>
            <span>30m</span>
            <span>60m</span>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
            Breaks per day
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleChange("breaksPerDay", n)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${formData.breaksPerDay === n ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Task Preferences ── */}
      <section className="bg-white rounded-2xl border p-6 flex flex-col gap-5">
        <h3 className="font-black text-gray-900">Task Preferences</h3>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
            Task ordering
          </label>
          <div className="flex flex-col gap-2">
            {[
              {
                value: "hard-first",
                label: "Hard first",
                desc: "High priority tasks scheduled early",
              },
              {
                value: "easy-first",
                label: "Easy first",
                desc: "Warm up with shorter tasks",
              },
              {
                value: "deadline",
                label: "Deadline first",
                desc: "Tasks closest to due date go first",
              },
              {
                value: "duration_asc",
                label: "Shortest first",
                desc: "Quick wins early in the day",
              },
              {
                value: "duration_desc",
                label: "Longest first",
                desc: "Big tasks while energy is high",
              },
            ].map(({ value, label, desc }) => (
              <label
                key={value}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.taskOrder === value ? "border-indigo-400 bg-indigo-50" : "border-gray-100 hover:border-gray-300"}`}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-all ${formData.taskOrder === value ? "border-indigo-600 bg-indigo-600" : "border-gray-300"}`}
                >
                  {formData.taskOrder === value && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
                <input
                  type="radio"
                  className="hidden"
                  name="taskOrder"
                  value={value}
                  checked={formData.taskOrder === value}
                  onChange={(e) => handleChange("taskOrder", e.target.value)}
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
            <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">
              Max tasks per day
            </label>
            <input
              type="number"
              value={formData.maxTasksPerDay}
              min="1"
              max="20"
              onChange={(e) =>
                handleChange("maxTasksPerDay", parseInt(e.target.value))
              }
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">
              Default duration
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.defaultTaskDuration}
                min="15"
                max="240"
                onChange={(e) =>
                  handleChange("defaultTaskDuration", parseInt(e.target.value))
                }
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                min
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Reminders ── */}
      <section className="bg-white rounded-2xl border p-6 flex flex-col gap-4">
        <h3 className="font-black text-gray-900">Reminders</h3>
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
            Remind me before deadlines
          </label>
          <div className="flex gap-2 flex-wrap">
            {[0, 1, 2, 3, 5, 7, 14].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleChange("reminderDays", n)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${formData.reminderDays === n ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}
              >
                {n === 0 ? "Day of" : `${n}d before`}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Save button ── */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save Preferences"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-semibold flex items-center gap-1.5">
            <span className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center text-[10px]">
              ✓
            </span>
            Saved successfully
          </span>
        )}
      </div>
    </div>
  );
}
