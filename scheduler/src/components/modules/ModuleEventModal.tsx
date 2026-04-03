/**
 * @file ModuleEventModal.tsx
 * @description A modal interface for creating or editing module-wide events. 
 * Allows users to set event details (title, location, category, date/time) 
 * which are distributed to all members' calendars upon submission.
 */

'use client';

import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { X, MapPin } from "lucide-react";
import { createModuleEvent, updateModuleEvent } from "@/app/actions/module";

/**
 * Represents an existing module event being edited.
 */
interface ExistingEvent {
  moduleEventGroupId: string | null;
  title: string;
  description: string | null;
  start: Date;
  end: Date;
  category: string;
  destLocationName?: string | null;
}

/**
 * Props for the ModuleEventModal component.
 */
interface ModuleEventModalProps {
  moduleId: string;
  editingEvent: ExistingEvent | null;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Represents the internal state of the event form.
 */
interface EventFormState {
  title: string;
  description: string;
  category: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  destLocationName: string;
}

const CATEGORIES = ["Lecture", "Individual Study", "Exam", "Personal", "Lab"] as const;

/**
 * Splits a Date into separate YYYY-MM-DD and HH:MM strings for form inputs.
 *
 * @param {Date} isoString - Date object to split.
 * @returns {{ date: string; time: string }} Separate date and time strings.
 */
function splitDateTime(isoString: Date): { date: string; time: string } {
  const d = new Date(isoString);
  return {
    date: d.toISOString().split('T')[0],
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
  };
}

/**
 * Builds the initial form state based on whether an event is being edited.
 *
 * @param {ExistingEvent | null} editingEvent - The event being edited, or null if creating new.
 * @returns {EventFormState} The formatted initial state.
 */
function buildInitialState(editingEvent: ExistingEvent | null): EventFormState {
  if (!editingEvent) {
    return { title: "", description: "", category: "Lecture", startDate: "", startTime: "", endDate: "", endTime: "", destLocationName: "" };
  }
  const start = splitDateTime(editingEvent.start);
  const end = splitDateTime(editingEvent.end);
  return {
    title: editingEvent.title,
    description: editingEvent.description || "",
    category: editingEvent.category,
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
    destLocationName: editingEvent.destLocationName || "",
  };
}

/**
 * Renders the modal header with contextual titles.
 *
 * @param {{ isEditing: boolean; onClose: () => void }} props - Component props.
 * @returns {JSX.Element} The header UI.
 */
function ModalHeader({ isEditing, onClose }: { isEditing: boolean; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="lunar-header">
          {isEditing ? "Edit Module Event" : "Create Module Event"}
        </h2>
        <p className="text-[10px] text-white/30 mt-1 font-medium uppercase tracking-widest">
          {isEditing ? "Changes apply to all members' calendars" : "Added to all members' calendars"}
        </p>
      </div>
      <Button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
        <X size={24} />
      </Button>
    </div>
  );
}

/**
 * Renders the standard text fields for the event form.
 *
 * @param {{ formData: EventFormState; onChange: (updates: Partial<EventFormState>) => void }} props - Component props.
 * @returns {JSX.Element} The text inputs.
 */
function BasicFields({ formData, onChange }: { formData: EventFormState; onChange: (updates: Partial<EventFormState>) => void }) {
  return (
    <>
      <div>
        <label className="lunar-label">Event Title <span className="text-red-400">*</span></label>
        <input type="text" required placeholder="e.g. Midterm Exam, Guest Lecture" value={formData.title} onChange={(e) => onChange({ title: e.target.value })} className="lunar-input w-full p-3 rounded-xl mt-1" />
      </div>
      <div>
        <label className="lunar-label flex items-center gap-1"><MapPin size={12} /> Location / Destination</label>
        <input type="text" placeholder="e.g. Room 101, Main Library" value={formData.destLocationName} onChange={(e) => onChange({ destLocationName: e.target.value })} className="lunar-input w-full p-3 rounded-xl mt-1" />
      </div>
      <div>
        <label className="lunar-label">Description</label>
        <textarea rows={2} placeholder="Optional description..." value={formData.description} onChange={(e) => onChange({ description: e.target.value })} className="lunar-input w-full p-3 rounded-xl mt-1 resize-none" />
      </div>
    </>
  );
}

/**
 * Renders the category selection pill buttons.
 *
 * @param {{ selectedCategory: string; onChange: (updates: Partial<EventFormState>) => void }} props - Component props.
 * @returns {JSX.Element} The category picker UI.
 */
function CategoryPicker({ selectedCategory, onChange }: { selectedCategory: string; onChange: (updates: Partial<EventFormState>) => void }) {
  return (
    <div>
      <label className="lunar-label">Category</label>
      <div className="flex flex-wrap gap-2 mt-1">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            type="button"
            onClick={() => onChange({ category: cat })}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
              selectedCategory === cat
                ? "border-blue-500 bg-blue-500/20 text-blue-400"
                : "border-white/10 bg-white/5 text-white/40 hover:border-white/20"
            }`}
          >
            {cat}
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * Renders a single row for date and time input.
 *
 * @param {{ label: string; dateVal: string; timeVal: string; onDateChange: (val: string) => void; onTimeChange: (val: string) => void }} props - Component props.
 * @returns {JSX.Element} The date/time row.
 */
function DateTimeRow({ label, dateVal, timeVal, onDateChange, onTimeChange }: { label: string; dateVal: string; timeVal: string; onDateChange: (val: string) => void; onTimeChange: (val: string) => void }) {
  return (
    <div>
      <label className="lunar-label mb-2">{label}</label>
      <input type="date" required value={dateVal} onChange={(e) => onDateChange(e.target.value)} className="lunar-input w-full p-2 rounded-xl mb-2" />
      <input type="time" required value={timeVal} onChange={(e) => onTimeChange(e.target.value)} className="lunar-input w-full p-2 rounded-xl" />
    </div>
  );
}

/**
 * Renders the grid containing start and end date/time inputs.
 *
 * @param {{ formData: EventFormState; onChange: (updates: Partial<EventFormState>) => void }} props - Component props.
 * @returns {JSX.Element} The date/time grid.
 */
function DateTimeGrid({ formData, onChange }: { formData: EventFormState; onChange: (updates: Partial<EventFormState>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <DateTimeRow label="Start" dateVal={formData.startDate} timeVal={formData.startTime} onDateChange={(val) => onChange({ startDate: val })} onTimeChange={(val) => onChange({ startTime: val })} />
      <DateTimeRow label="End" dateVal={formData.endDate} timeVal={formData.endTime} onDateChange={(val) => onChange({ endDate: val })} onTimeChange={(val) => onChange({ endTime: val })} />
    </div>
  );
}

/**
 * Modal for creating or editing a module-wide event distributed to all members.
 *
 * @param {ModuleEventModalProps} props - Module ID, optional existing event, and callbacks.
 * @returns {JSX.Element} Module event creation/edit modal.
 */
export default function ModuleEventModal({ moduleId, editingEvent, onClose, onSuccess }: ModuleEventModalProps) {
  const isEditing = editingEvent !== null;
  const [formData, setFormData] = useState<EventFormState>(() => buildInitialState(editingEvent));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (updates: Partial<EventFormState>) => setFormData((prev) => ({ ...prev, ...updates }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const start = new Date(`${formData.startDate}T${formData.startTime}`);
    const end = new Date(`${formData.endDate}T${formData.endTime}`);

    if (end <= start) return setError("End time must be after start time");

    setIsSubmitting(true);

    const payload = {
      title: formData.title, description: formData.description, category: formData.category,
      start: start.toISOString(), end: end.toISOString(), allDay: false, destLocationName: formData.destLocationName || null,
    };

    const result = isEditing && editingEvent.moduleEventGroupId
      ? await updateModuleEvent(editingEvent.moduleEventGroupId, moduleId, payload)
      : await createModuleEvent(moduleId, payload);

    setIsSubmitting(false);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError('error' in result ? result.error as string : "Failed to save event");
    }
  };

  return (
    <div className="lunar-overlay z-[100]">
      <div className="lunar-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <ModalHeader isEditing={isEditing} onClose={onClose} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <BasicFields formData={formData} onChange={handleChange} />
          <CategoryPicker selectedCategory={formData.category} onChange={handleChange} />
          <DateTimeGrid formData={formData} onChange={handleChange} />

          {error && <div className="lunar-item-error px-4 py-3 rounded-lg border text-sm">{error}</div>}

          <div className="flex gap-3 pt-4 border-t lunar-divider">
            <Button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 lunar-button-ghost disabled:opacity-50">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 lunar-button-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Event"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}