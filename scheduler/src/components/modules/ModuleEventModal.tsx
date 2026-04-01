'use client';
import { Button } from "@/components/ui/Button";

import { useState } from "react";
import { X, MapPin } from "lucide-react";
import { createModuleEvent, updateModuleEvent } from "@/app/actions/module";

//types
interface ExistingEvent {
  moduleEventGroupId: string | null;
  title: string;
  description: string | null;
  start: Date;
  end: Date;
  category: string;
  destLocationName?: string | null;
}

interface ModuleEventModalProps {
  moduleId: string;
  editingEvent: ExistingEvent | null;
  onClose: () => void;
  onSuccess: () => void;
}

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

//helpers

/**
 * Splits a Date into separate YYYY-MM-DD and HH:MM strings for form inputs.
 * @param {Date} isoString - Date object to split.
 * @return {{ date: string; time: string }} Separate date and time strings.
 */
function splitDateTime(isoString: Date): { date: string; time: string } {
  const d = new Date(isoString);
  return {
    date: d.toISOString().split('T')[0],
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
  };
}

//component

/**
 * Modal for creating or editing a module-wide event distributed to all members.
 * @param {ModuleEventModalProps} props - Module ID, optional existing event, and callbacks.
 * @return {JSX.Element} Module event creation/edit modal.
 */
export default function ModuleEventModal({ moduleId, editingEvent, onClose, onSuccess }: ModuleEventModalProps) {
  const isEditing = editingEvent !== null;

  const buildInitialState = (): EventFormState => {
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
  };

  const [formData, setFormData] = useState<EventFormState>(buildInitialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Updates a single field in the form state.
   * @param {Partial<EventFormState>} updates - Fields to update.
   * @return {void}
   */
  const handleChange = (updates: Partial<EventFormState>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  /**
   * Validates times and submits the event to create or update all member copies.
   * @param {React.FormEvent} e - Form submit event.
   * @return {Promise<void>}
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const start = new Date(`${formData.startDate}T${formData.startTime}`);
    const end = new Date(`${formData.endDate}T${formData.endTime}`);

    if (end <= start) {
      setError("End time must be after start time");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: false,
      destLocationName: formData.destLocationName || null,
    };

    const result = isEditing && editingEvent.moduleEventGroupId
      ? await updateModuleEvent(editingEvent.moduleEventGroupId, moduleId, payload)
      : await createModuleEvent(moduleId, payload);

    setIsSubmitting(false);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError('error' in result ? result.error : "Failed to save event");
    }
  };

  return (
    <div className="lunar-overlay z-[100]">
      <div className="lunar-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
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

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Title */}
          <div>
            <label className="lunar-label">Event Title <span className="text-red-400">*</span></label>
            <input type="text" required placeholder="e.g. Midterm Exam, Guest Lecture"
              value={formData.title} onChange={(e) => handleChange({ title: e.target.value })}
              className="lunar-input w-full p-3 rounded-xl mt-1" />
          </div>

          {/* Location */}
          <div>
            <label className="lunar-label flex items-center gap-1">
              <MapPin size={12} /> Location / Destination
            </label>
            <input type="text" placeholder="e.g. Room 101, Main Library"
              value={formData.destLocationName} onChange={(e) => handleChange({ destLocationName: e.target.value })}
              className="lunar-input w-full p-3 rounded-xl mt-1" />
          </div>

          {/* Description */}
          <div>
            <label className="lunar-label">Description</label>
            <textarea rows={2} placeholder="Optional description..."
              value={formData.description} onChange={(e) => handleChange({ description: e.target.value })}
              className="lunar-input w-full p-3 rounded-xl mt-1 resize-none" />
          </div>

          {/* Category */}
          <div>
            <label className="lunar-label">Category</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {CATEGORIES.map((cat) => (
                <Button key={cat} type="button" onClick={() => handleChange({ category: cat })}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                    formData.category === cat
                      ? "border-blue-500 bg-blue-500/20 text-blue-400"
                      : "border-white/10 bg-white/5 text-white/40 hover:border-white/20"
                  }`}>
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Start / End */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="lunar-label mb-2">Start</label>
              <input type="date" required value={formData.startDate}
                onChange={(e) => handleChange({ startDate: e.target.value })}
                className="lunar-input w-full p-2 rounded-xl mb-2" />
              <input type="time" required value={formData.startTime}
                onChange={(e) => handleChange({ startTime: e.target.value })}
                className="lunar-input w-full p-2 rounded-xl" />
            </div>
            <div>
              <label className="lunar-label mb-2">End</label>
              <input type="date" required value={formData.endDate}
                onChange={(e) => handleChange({ endDate: e.target.value })}
                className="lunar-input w-full p-2 rounded-xl mb-2" />
              <input type="time" required value={formData.endTime}
                onChange={(e) => handleChange({ endTime: e.target.value })}
                className="lunar-input w-full p-2 rounded-xl" />
            </div>
          </div>

          {error && (
            <div className="lunar-item-error px-4 py-3 rounded-lg border text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={onClose} disabled={isSubmitting}
              className="flex-1 lunar-button-ghost disabled:opacity-50">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}
              className="flex-1 lunar-button-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Event"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}