"use client";
// src/components/shared/FormField.tsx
// Single-responsibility: renders a labelled form field wrapper.

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
}

export function FormField({ label, children }: FormFieldProps) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-400 uppercase">
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle — reusable on/off switch
// ---------------------------------------------------------------------------
interface ToggleProps {
  on: boolean;
  onToggle: () => void;
  label: string;
}

export function Toggle({ on, onToggle, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        className={`w-10 h-5 rounded-full relative ${on ? "bg-indigo-600" : "bg-gray-200"}`}
        onClick={onToggle}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? "left-5" : "left-0.5"}`}
        />
      </div>
      <span className="text-xs font-semibold text-gray-600">{label}</span>
    </label>
  );
}

// ---------------------------------------------------------------------------
// DayPicker — weekly day selector used in recurrence and preferences
// ---------------------------------------------------------------------------
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

interface DayPickerProps {
  selected: string[];
  onChange: (days: string[]) => void;
}

export function DayPicker({ selected, onChange }: DayPickerProps) {
  const toggle = (day: string) =>
    onChange(
      selected.includes(day)
        ? selected.filter((d) => d !== day)
        : [...selected, day],
    );
  return (
    <div className="flex flex-wrap gap-1.5">
      {DAYS.map((day) => (
        <button
          key={day}
          type="button"
          onClick={() => toggle(day)}
          className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all ${
            selected.includes(day)
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-gray-600 border-gray-300"
          }`}
        >
          {day}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RecurrencePanel — recurring task configuration section
// ---------------------------------------------------------------------------
interface RecurrencePanelProps {
  type: string;
  days: string[];
  until: string;
  onType: (t: string) => void;
  onDays: (d: string[]) => void;
  onUntil: (u: string) => void;
  options?: { value: string; label: string }[];
}

const DEFAULT_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export function RecurrencePanel({
  type,
  days,
  until,
  onType,
  onDays,
  onUntil,
  options = DEFAULT_OPTIONS,
}: RecurrencePanelProps) {
  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
      <select
        value={type}
        onChange={(e) => onType(e.target.value)}
        className="w-full border border-gray-200 p-2 rounded-lg text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {type === "weekly" && <DayPicker selected={days} onChange={onDays} />}
      <div>
        <label className="text-xs font-bold text-gray-400">Until</label>
        <input
          type="date"
          value={until}
          onChange={(e) => onUntil(e.target.value)}
          className="w-full border border-gray-200 p-2 rounded-lg text-sm mt-1"
        />
      </div>
    </div>
  );
}
