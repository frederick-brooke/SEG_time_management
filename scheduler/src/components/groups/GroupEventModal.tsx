'use client';

import { useState } from "react";
import { X } from "lucide-react";
import { createGroupEvent, updateGroupEvent } from "@/app/actions/groups";

//types
interface ExistingEvent {
  groupEventGroupId: string | null;
  title: string;
  description: string | null;
  start: Date;
  end: Date;
  category: string;
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
}

const CATEGORIES = ["Social", "Study", "Lecture", "Exam", "Personal", "Lab"] as const;


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
      return { title: "", description: "", category: "Social", startDate: "", startTime: "", endDate: "", endTime: "" };
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isEditing ? "Edit Group Event" : "Create Group Event"}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {isEditing ? "Changes apply to all members' calendars" : "Added to all members' calendars"}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Group Study, Movie Night"
              value={formData.title}
              onChange={(e) => handleChange({ title: e.target.value })}
              className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent focus:outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              rows={2}
              placeholder="Optional description..."
              value={formData.description}
              onChange={(e) => handleChange({ description: e.target.value })}
              className="w-full border border-gray-200 bg-gray-50 p-3 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleChange({ category: cat })}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                    formData.category === cat
                      ? "border-purple-600 bg-purple-50 text-purple-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
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
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Start</label>
              <input type="date" required value={formData.startDate}
                onChange={(e) => handleChange({ startDate: e.target.value })}
                className="w-full border border-gray-200 p-2 rounded-lg mb-2" />
              <input type="time" required value={formData.startTime}
                onChange={(e) => handleChange({ startTime: e.target.value })}
                className="w-full border border-gray-200 p-2 rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">End</label>
              <input type="date" required value={formData.endDate}
                onChange={(e) => handleChange({ endDate: e.target.value })}
                className="w-full border border-gray-200 p-2 rounded-lg mb-2" />
              <input type="time" required value={formData.endTime}
                onChange={(e) => handleChange({ endTime: e.target.value })}
                className="w-full border border-gray-200 p-2 rounded-lg" />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Event"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
