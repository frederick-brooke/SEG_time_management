"use client";
import { useState } from "react";
import { LunarCard } from "@/components/ui/lunar-card";

const DAYS = [
  { label: "Monday", abbr: "Mon" },
  { label: "Tuesday", abbr: "Tue" },
  { label: "Wednesday", abbr: "Wed" },
  { label: "Thursday", abbr: "Thu" },
  { label: "Friday", abbr: "Fri" },
  { label: "Saturday", abbr: "Sat" },
  { label: "Sunday", abbr: "Sun" },
];

export default function QuizPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleChange = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleNext = () => currentStep < 4 && setCurrentStep((s) => s + 1);
  const handleBack = () => currentStep > 1 && setCurrentStep((s) => s - 1);

  const STEP_TITLES = ["Work Schedule", "Breaks & Sessions", "Task Preferences", "Reminders"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F1A] px-4 relative overflow-hidden">
      {/* background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.15),transparent_40%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(147,51,234,0.12),transparent_40%)]" />

      <LunarCard className="max-w-2xl w-full p-8 rounded-[2.5em] backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_0_40px_rgba(59,130,246,0.15)]">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-xs lunar-page-subtitle text-white/50 mb-2">
            <span>Step {currentStep} of 4</span>
            <span>{Math.round((currentStep / 4) * 100)}%</span>
          </div>

          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_12px_rgba(59,130,246,0.6)] transition-all"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>

          <div className="flex justify-between mt-4">
            {STEP_TITLES.map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`lunar-page-subtitle w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all
                  ${
                    i + 1 < currentStep
                      ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white"
                      : i + 1 === currentStep
                      ? "bg-blue-500 text-white ring-4 ring-blue-500/20 scale-110"
                      : "bg-white/10 text-white/30"
                  }`}
                >
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Title */}
        <h2 className="lunar-header text-2xl font-black text-white tracking-tight mb-6">
          {STEP_TITLES[currentStep - 1]}
        </h2>

        {/* Step 1 */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-4">
            <input
              type="time"
              value={formData.workStartTime}
              onChange={(e) => handleChange("workStartTime", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
            />

            <input
              type="time"
              value={formData.workEndTime}
              onChange={(e) => handleChange("workEndTime", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
            />

            <div className="grid grid-cols-2 gap-2">
              {DAYS.map(({ label, abbr }) => {
                const checked = formData.daysOff.includes(abbr);
                return (
                  <button
                    key={abbr}
                    onClick={() =>
                      handleChange(
                        "daysOff",
                        checked
                          ? formData.daysOff.filter((d) => d !== abbr)
                          : [...formData.daysOff, abbr]
                      )
                    }
                    className={`lunar-page-subtitle p-3 rounded-xl text-sm font-bold transition-all
                    ${
                      checked
                        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/40 text-white"
                        : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {currentStep === 2 && (
          <div className="flex flex-col gap-6">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <input
                type="range"
                min="15"
                max="180"
                step="15"
                value={formData.sessionLength}
                onChange={(e) => handleChange("sessionLength", +e.target.value)}
                className="w-full"
              />
              <p className="lunar-page-subtitle text-blue-400 font-bold mt-2">
                {formData.sessionLength} min work
              </p>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={formData.breakLength}
                onChange={(e) => handleChange("breakLength", +e.target.value)}
                className="w-full"
              />
              <p className="lunar-page-subtitle text-purple-400 font-bold mt-2">
                {formData.breakLength} min break
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="lunar-page-subtitle flex justify-between mt-8">
          <button
            onClick={handleBack}
            className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
          >
            Back
          </button>

          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold shadow-lg hover:scale-105 active:scale-95"
            >
              Next
            </button>
          ) : (
            <button
              disabled={isLoading}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold"
            >
              {isLoading ? "Saving..." : "Complete"}
            </button>
          )}
        </div>
      </LunarCard>
    </div>
  );
}
