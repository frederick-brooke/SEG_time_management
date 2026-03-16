"use client";
import { useState } from "react";

// Days must match the abbreviations the scheduler uses
const DAYS = [
  { label: "Monday",    abbr: "Mon" },
  { label: "Tuesday",   abbr: "Tue" },
  { label: "Wednesday", abbr: "Wed" },
  { label: "Thursday",  abbr: "Thu" },
  { label: "Friday",    abbr: "Fri" },
  { label: "Saturday",  abbr: "Sat" },
  { label: "Sunday",    abbr: "Sun" },
];

export default function QuizPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading]     = useState(false);
  const [formData, setFormData]        = useState({
    workStartTime:       "09:00",
    workEndTime:         "17:00",
    daysOff:             [] as string[], // stores abbreviations: "Mon", "Sat", etc.
    sessionLength:       90,
    breakLength:         15,
    breaksPerDay:        3,
    taskOrder:           "hard-first",
    maxTasksPerDay:      8,
    defaultTaskDuration: 60,
    reminderDays:        2,
  });

  const handleNext = () => { if (currentStep < 4) setCurrentStep(currentStep + 1); };
  const handleBack = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const handleChange = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const sessionRes = await fetch("/api/auth/session");
      const session    = await sessionRes.json();
      if (!session?.user?.id) { alert("Failed to get user session"); setIsLoading(false); return; }

      const res = await fetch("/api/preferences", {
        method:  "POST",
        headers: { "Content-type": "application/json" },
        body:    JSON.stringify({ userID: session.user.id, ...formData }),
      });

      if (!res.ok) throw new Error("Failed to save preferences");
      window.location.href = "/dashboard";
    } catch (error) {
      console.error(error);
      alert("Failed to save preferences. Please try again.");
      setIsLoading(false);
    }
  };

  const STEP_TITLES = ["Work Schedule", "Breaks & Sessions", "Task Preferences", "Reminders"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-md">

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500 font-medium">Step {currentStep} of 4</p>
            <p className="text-sm text-gray-400">{Math.round((currentStep / 4) * 100)}%</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }} />
          </div>
          {/* Step dots */}
          <div className="flex justify-between mt-3">
            {STEP_TITLES.map((title, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i + 1 < currentStep ? "bg-indigo-600 text-white" : i + 1 === currentStep ? "bg-indigo-600 text-white ring-4 ring-indigo-100" : "bg-gray-200 text-gray-400"}`}>
                  {i + 1 < currentStep ? "✓" : i + 1}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${i + 1 === currentStep ? "text-indigo-600" : "text-gray-400"}`}>{title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="mb-8">
          <h2 className="text-2xl font-black text-gray-900 mb-6">{STEP_TITLES[currentStep - 1]}</h2>

          {/* ── Step 1: Work Schedule ── */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">When do you start working?</label>
                <input type="time" value={formData.workStartTime}
                  onChange={(e) => handleChange("workStartTime", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">When do you stop working?</label>
                <input type="time" value={formData.workEndTime}
                  onChange={(e) => handleChange("workEndTime", e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
                <p className="text-xs text-gray-400 mt-1">
                  {(() => {
                    const [sh, sm] = formData.workStartTime.split(":").map(Number);
                    const [eh, em] = formData.workEndTime.split(":").map(Number);
                    const total = (eh * 60 + em) - (sh * 60 + sm);
                    if (total <= 0) return "";
                    return `${Math.floor(total / 60)}h ${total % 60 > 0 ? `${total % 60}m` : ""} working window`;
                  })()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Which days are you off?</label>
                <div className="grid grid-cols-2 gap-2">
                  {DAYS.map(({ label, abbr }) => {
                    const checked = formData.daysOff.includes(abbr);
                    return (
                      <label key={abbr}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checked ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${checked ? "bg-indigo-600" : "border-2 border-gray-300"}`}>
                          {checked && <span className="text-white text-[10px] font-bold">✓</span>}
                        </div>
                        <input type="checkbox" className="hidden" checked={checked}
                          onChange={(e) => handleChange("daysOff", e.target.checked ? [...formData.daysOff, abbr] : formData.daysOff.filter((d) => d !== abbr))} />
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                      </label>
                    );
                  })}
                </div>
                {formData.daysOff.length > 0 && (
                  <p className="text-xs text-indigo-600 font-medium mt-2">
                    Days off: {formData.daysOff.join(", ")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Breaks & Sessions ── */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  How long do you work before taking a break?
                </label>
                <div className="flex items-center gap-3">
                  <input type="range" min="15" max="180" step="15" value={formData.sessionLength}
                    onChange={(e) => handleChange("sessionLength", parseInt(e.target.value))}
                    className="flex-1 accent-indigo-600" />
                  <span className="text-sm font-bold text-indigo-600 w-16 text-right">{formData.sessionLength} min</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>15m</span><span>1h</span><span>2h</span><span>3h</span></div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">How long are your breaks?</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="5" max="60" step="5" value={formData.breakLength}
                    onChange={(e) => handleChange("breakLength", parseInt(e.target.value))}
                    className="flex-1 accent-indigo-600" />
                  <span className="text-sm font-bold text-indigo-600 w-16 text-right">{formData.breakLength} min</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>5m</span><span>15m</span><span>30m</span><span>60m</span></div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">How many breaks per day?</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5,6].map((n) => (
                    <button key={n} type="button"
                      onClick={() => handleChange("breaksPerDay", n)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${formData.breaksPerDay === n ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              {/* Preview */}
              <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Your schedule preview</p>
                <p className="text-sm text-indigo-700">
                  Work <strong>{formData.sessionLength}min</strong> → Break <strong>{formData.breakLength}min</strong>, repeated up to <strong>{formData.breaksPerDay}×</strong> per day
                </p>
                <p className="text-xs text-indigo-500 mt-1">
                  Effective work time: ~{Math.round(formData.sessionLength * formData.breaksPerDay)}min/day (before breaks)
                </p>
              </div>
            </div>
          )}

          {/* ── Step 3: Task Preferences ── */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">How do you prefer to order tasks?</label>
                <div className="flex flex-col gap-2">
                  {[
                    { value: "hard-first",     label: "Hard tasks first",     desc: "High priority & long tasks scheduled early" },
                    { value: "easy-first",     label: "Easy tasks first",     desc: "Shorter, lower priority tasks to warm up" },
                    { value: "deadline",       label: "Deadline first",       desc: "Tasks closest to their due date scheduled first" },
                    { value: "duration_asc",   label: "Shortest first",       desc: "Get quick wins early in the day" },
                    { value: "duration_desc",  label: "Longest first",        desc: "Tackle big tasks while energy is high" },
                  ].map(({ value, label, desc }) => (
                    <label key={value}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${formData.taskOrder === value ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-all ${formData.taskOrder === value ? "border-indigo-600 bg-indigo-600" : "border-gray-300"}`}>
                        {formData.taskOrder === value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <input type="radio" name="taskOrder" value={value} className="hidden"
                        checked={formData.taskOrder === value}
                        onChange={(e) => handleChange("taskOrder", e.target.value)} />
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Max tasks per day</label>
                  <input type="number" value={formData.maxTasksPerDay} min="1" max="20"
                    onChange={(e) => handleChange("maxTasksPerDay", parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Default task duration</label>
                  <div className="relative">
                    <input type="number" value={formData.defaultTaskDuration} min="15" max="240"
                      onChange={(e) => handleChange("defaultTaskDuration", parseInt(e.target.value))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-400 pr-12" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">min</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Reminders ── */}
          {currentStep === 4 && (
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  How many days before a deadline should we remind you?
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[0,1,2,3,5,7,14].map((n) => (
                    <button key={n} type="button"
                      onClick={() => handleChange("reminderDays", n)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${formData.reminderDays === n ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}>
                      {n === 0 ? "Day of" : `${n}d`}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  {formData.reminderDays === 0
                    ? "You'll be reminded on the day the task is due."
                    : `You'll be reminded ${formData.reminderDays} day${formData.reminderDays !== 1 ? "s" : ""} before tasks are due.`}
                </p>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col gap-3 mt-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your preferences summary</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-400">Work hours</span><p className="font-semibold text-gray-800">{formData.workStartTime} – {formData.workEndTime}</p></div>
                  <div><span className="text-gray-400">Days off</span><p className="font-semibold text-gray-800">{formData.daysOff.length > 0 ? formData.daysOff.join(", ") : "None"}</p></div>
                  <div><span className="text-gray-400">Session</span><p className="font-semibold text-gray-800">{formData.sessionLength}min work, {formData.breakLength}min break</p></div>
                  <div><span className="text-gray-400">Task order</span><p className="font-semibold text-gray-800">{formData.taskOrder.replace("-", " ")}</p></div>
                  <div><span className="text-gray-400">Max tasks/day</span><p className="font-semibold text-gray-800">{formData.maxTasksPerDay}</p></div>
                  <div><span className="text-gray-400">Reminders</span><p className="font-semibold text-gray-800">{formData.reminderDays === 0 ? "Day of" : `${formData.reminderDays}d before`}</p></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button onClick={handleBack} disabled={currentStep === 1}
            className="px-6 py-2.5 border border-gray-300 rounded-full text-sm font-semibold text-gray-600 disabled:opacity-30 hover:border-gray-400 transition-all">
            Back
          </button>
          {currentStep < 4 ? (
            <button onClick={handleNext}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-bold hover:bg-indigo-700 transition-all">
              Next →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={isLoading}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-black transition-all disabled:opacity-50">
              {isLoading ? "Saving…" : "Complete Setup ✓"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}