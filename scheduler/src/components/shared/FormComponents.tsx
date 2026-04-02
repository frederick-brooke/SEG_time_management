/**
 * @file src/components/shared/FormField.tsx
 * @description Single-responsibility: renders a labelled form field wrapper.

 */
"use client";

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
}

/**
 * A standard wrapper for form inputs that provides consistent label styling and layout.
 * @param {FormFieldProps} props - The component properties.
 * @returns {JSX.Element} The labeled form field.
 */
export function FormField({ label, children }: FormFieldProps) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-400 uppercase block mb-1">
        {label}
      </label>
      <div>{children}</div>
    </div>
  );
}

// Toggle — reusable on/off switch
interface ToggleProps {
  on: boolean;
  onToggle: () => void;
  label: string;
}
/**
 * A reusable, fully accessible on/off switch component.
 * @param {ToggleProps} props - The component properties.
 * @returns {JSX.Element} The accessible toggle switch.
 */
export function Toggle({ on, onToggle, label }: ToggleProps) {
  return (
    <div className="flex items-center gap-2 select-none">
      {/* V.4.2 Polish: Semantic button with ARIA attributes instead of a clickable div */}
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onToggle}
        className={`w-10 h-5 rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
          on ? "bg-indigo-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
            on ? "left-5" : "left-0.5"
          }`}
        />
      </button>
      <span className="text-xs font-semibold text-gray-600 cursor-pointer" onClick={onToggle}>
        {label}
      </span>
    </div>
  );
}

// DayPicker — weekly day selector used in recurrence and preferences
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

interface DayPickerProps {
  selected: string[];
  onChange: (days: string[]) => void;
}

/**
 * A weekly day selector used for defining recurrence patterns or user preferences.
 * @param {DayPickerProps} props - The component properties.
 * @returns {JSX.Element} A grid of selectable day buttons.
 */
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
          className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
            selected.includes(day)
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
          }`}
        >
          {day}
        </button>
      ))}
    </div>
  );
}

// RecurrencePanel — recurring task configuration section
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

/**
 * Configuration section for establishing recurring task schedules.
 * @param {RecurrencePanelProps} props - The component properties.
 * @returns {JSX.Element} The recurrence configuration form panel.
 */
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
      <Select
        value={type}
        onChange={(e) => onType(e.target.value)}
        className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      
      {type === "weekly" && <DayPicker selected={days} onChange={onDays} />}
      
      <div>
        {/* 1. ADDED htmlFor="until-date" HERE */}
        <label htmlFor="until-date" className="text-xs font-bold text-gray-400 block mb-1">
          Until
        </label>
        
        {/* 2. ADDED id="until-date" HERE */}
        <input
          id="until-date"
          type="date"
          value={until}
          onChange={(e) => onUntil(e.target.value)}
          className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:outline-none focus:border-indigo-400"
        />
      </div>
    </div>
  );
}