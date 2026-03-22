'use client';

import { useState } from "react";
import { X, MapPin } from "lucide-react";
import { createGroupEvent, updateGroupEvent } from "@/app/actions/groups";

//section types
interface ExistingEvent {
  groupEventGroupId: string | null;
  title: string;
  description: string | null;
  start: Date;
  end: Date;
  category: string;
  destLocationName?: string | null;
}

interface GroupEventModalProps {
  groupId: string;
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

//section constants
const CATEGORIES = ["Social", "Study", "Lecture", "Exam", "Personal", "Lab"] as const;

//section helpers

/**
 * Splits a Date into separate YYYY-MM-DD and HH:MM strings for form inputs
 * @param {Date} date - Date object to split
 * @return {{ date: string; time: string }} - Separate date and time strings
 */
function splitDateTime(date: Date): { date: string; time: string } {
  const d = new Date(date);
  return {
    date: d.toISOString().split("T")[0],
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

//section component

/**
 * Modal for creating or editing a group-wide event distributed to all members
 * Any group member can create or edit events
 * @param {GroupEventModalProps} props - Group ID, optional existing event, and callbacks
 * @return {JSX.Element} - Group event creation/edit modal
 */
export default function GroupEventModal({
  groupId, editingEvent, onClose, onSuccess,
}: GroupEventModalProps) {
  const isEditing = editingEvent !== null;

  const buildInitialState = (): EventFormState => {
    if (!editingEvent) {
      return { 
        title: "", description: "", category: "Social", 
        startDate: "", startTime: "", endDate: "", endTime: "", 
        destLocationName: "" 
      };
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
   * Updates a single field in the form state
   * @param {Partial<EventFormState>} updates - Field(s) to update
   * @return {void}
   */
  const handleChange = (updates: Partial<EventFormState>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  /**
   * Validates times and submits the event to create or update all member copies
   * @param {React.FormEvent} e - Form submit event
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

    const result = isEditing && editingEvent.groupEventGroupId
      ? await updateGroupEvent(editingEvent.groupEventGroupId, groupId, payload)
      : await createGroupEvent(groupId, payload);

    setIsSubmitting(false);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.error || "Failed to save event");
    }
  };

  return (
    <div className="lunar-overlay z-50">
      <div className="lunar-card max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto lunar-scroll">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="lunar-header text-xl text-white">
              {isEditing ? "Edit Group Event" : "Create Group Event"}
            </h2>
            <p className="lunar-value text-xs mt-1">
              {isEditing ? "Changes apply to all members' calendars" : "Added to all members' calendars"}
            </p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Title */}
          <div>
            <label className="lunar-label flex items-center gap-1">
              Event Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Group Study, Movie Night"
              value={formData.title}
              onChange={(e) => handleChange({ title: e.target.value })}
              className="lunar-input w-full p-3 mt-1"
            />
          </div>

          {/* Location / Destination */}
          <div>
            <label className="lunar-label flex items-center gap-1">
              <MapPin size={12} className="text-white/40" /> Location / Destination
            </label>
            <input 
              type="text" 
              placeholder="e.g. Student Union, Coffee Shop" 
              value={formData.destLocationName} 
              onChange={(e) => handleChange({ destLocationName: e.target.value })} 
              className="lunar-input w-full p-3 mt-1" 
            />
          </div>

          {/* Description */}
          <div>
            <label className="lunar-label">Description</label>
            <textarea
              rows={3}
              placeholder="Optional description..."
              value={formData.description}
              onChange={(e) => handleChange({ description: e.target.value })}
              className="lunar-input w-full p-3 mt-1 resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="lunar-label mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleChange({ category: cat })}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all ${
                    formData.category === cat
                      ? "border-blue-500/50 bg-blue-500/20 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                      : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Start / End */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="lunar-label">Start</label>
              <input type="date" required value={formData.startDate}
                onChange={(e) => handleChange({ startDate: e.target.value })}
                className="lunar-input w-full p-2 mb-2" />
              <input type="time" required value={formData.startTime}
                onChange={(e) => handleChange({ startTime: e.target.value })}
                className="lunar-input w-full p-2" />
            </div>
            <div>
              <label className="lunar-label">End</label>
              <input type="date" required value={formData.endDate}
                onChange={(e) => handleChange({ endDate: e.target.value })}
                className="lunar-input w-full p-2 mb-2" />
              <input type="time" required value={formData.endTime}
                onChange={(e) => handleChange({ endTime: e.target.value })}
                className="lunar-input w-full p-2" />
            </div>
          </div>

          {error && (
            <div className="lunar-item-error px-4 py-3 rounded-xl border text-sm font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t lunar-divider">
            <button type="button" onClick={onClose} disabled={isSubmitting}
              className="flex-1 lunar-button-ghost disabled:opacity-50 py-3">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 lunar-button-primary !text-white !bg-white/10 !border-white/20 hover:!bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed py-3">
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Event"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}