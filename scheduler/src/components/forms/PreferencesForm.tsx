/**
 * Form for managing user work, session, and task preferences.
 * Utilizes sub-components to maintain strict conciseness and separation of UI concerns.
 */
"use client";
import { useState, useEffect } from "react";

const DAYS = [
  { label: "Mon", abbr: "Mon" }, { label: "Tue", abbr: "Tue" }, { label: "Wed", abbr: "Wed" },
  { label: "Thu", abbr: "Thu" }, { label: "Fri", abbr: "Fri" }, { label: "Sat", abbr: "Sat" }, { label: "Sun", abbr: "Sun" },
];

interface PreferencesFormProps {
  userId: string;
  onSaved?: () => void;
}

// Helper to calculate total working minutes
const getWorkingMins = (start: string, end: string) => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, eh * 60 + em - (sh * 60 + sm));
};

export default function PreferencesForm({ userId, onSaved }: PreferencesFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    workStartTime: "09:00", workEndTime: "17:00", daysOff: [] as string[],
    sessionLength: 90, breakLength: 15, breaksPerDay: 3,
    taskOrder: "hard-first", maxTasksPerDay: 8, defaultTaskDuration: 60, reminderDays: 2,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/preferences?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.preferences) setFormData(prev => ({ ...prev, ...data.preferences }));
        }
      } catch (e) {
        console.error("Failed to load preferences:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleChange = (field: string, value: any) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/preferences", {
        method: "POST", headers: { "Content-Type": "application/json" },
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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <WorkHoursSection formData={formData} handleChange={handleChange} />
      <SessionsSection formData={formData} handleChange={handleChange} />
      <TaskPreferencesSection formData={formData} handleChange={handleChange} />
      
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save Preferences"}
        </button>
        {saved && <span className="text-sm text-green-600 font-semibold">✓ Saved successfully</span>}
      </div>
    </div>
  );
}

/**
 * V.3.2 Sub-Components: Keeps nesting low and chunks logical UI sections.
 */
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div data-testid="loading-spinner" className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function WorkHoursSection({ formData, handleChange }: any) {
  const workingMins = getWorkingMins(formData.workStartTime, formData.workEndTime);

  return (
    <section className="bg-white rounded-2xl border p-6 flex flex-col gap-5">
      <h3 className="font-black text-gray-900">Work Hours</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Start time</label>
          <input type="time" value={formData.workStartTime} onChange={(e) => handleChange("workStartTime", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">End time</label>
          <input type="time" value={formData.workEndTime} onChange={(e) => handleChange("workEndTime", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
        </div>
      </div>
      
      {workingMins > 0 && <p className="text-xs text-indigo-600 font-medium">{Math.floor(workingMins / 60)}h {workingMins % 60 > 0 ? `${workingMins % 60}m` : ""} working window</p>}

      <div>
        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Days off</label>
        <div className="flex gap-2">
          {DAYS.map(({ label, abbr }) => {
            const on = formData.daysOff.includes(abbr);
            return (
              <button key={abbr} type="button" onClick={() => handleChange("daysOff", on ? formData.daysOff.filter((d: string) => d !== abbr) : [...formData.daysOff, abbr])} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${on ? "bg-red-500 text-white" : "bg-white text-gray-600"}`}>
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SessionsSection({ formData, handleChange }: any) {
  return (
    <section className="bg-white rounded-2xl border p-6 flex flex-col gap-5">
      <h3 className="font-black text-gray-900">Sessions & Breaks</h3>
      <div>
        <div className="flex justify-between mb-2"><label className="text-xs font-bold text-gray-400 uppercase">Work session length</label><span className="text-sm font-bold text-indigo-600">{formData.sessionLength} min</span></div>
        <input type="range" min="15" max="180" step="15" value={formData.sessionLength} onChange={(e) => handleChange("sessionLength", parseInt(e.target.value))} className="w-full accent-indigo-600" />
      </div>
      <div>
        <div className="flex justify-between mb-2"><label className="text-xs font-bold text-gray-400 uppercase">Break length</label><span className="text-sm font-bold text-indigo-600">{formData.breakLength} min</span></div>
        <input type="range" min="5" max="60" step="5" value={formData.breakLength} onChange={(e) => handleChange("breakLength", parseInt(e.target.value))} className="w-full accent-indigo-600" />
      </div>
    </section>
  );
}

function TaskPreferencesSection({ formData, handleChange }: any) {
  return (
    <section className="bg-white rounded-2xl border p-6 flex flex-col gap-5">
      <h3 className="font-black text-gray-900">Task Preferences</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Max tasks per day</label>
          <input type="number" value={formData.maxTasksPerDay} min="1" max="20" onChange={(e) => handleChange("maxTasksPerDay", parseInt(e.target.value))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Default duration (min)</label>
          <input type="number" value={formData.defaultTaskDuration} min="15" max="240" onChange={(e) => handleChange("defaultTaskDuration", parseInt(e.target.value))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm" />
        </div>
      </div>
    </section>
  );
}