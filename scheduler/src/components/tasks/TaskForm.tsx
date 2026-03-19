"use client";
// src/components/tasks/TaskForm.tsx
import { useState, useEffect } from "react";
import { FormField, RecurrencePanel } from "@/components/shared/FormComponents";
import { relativeOffsetLabel } from "@/lib/ui";

export interface TaskFormData {
  name: string;
  description: string;
  dueDate: string | null;
  url: string;
  subtasks: string;
  durationHours: string;
  durationMinutes: string;
  examId: string;
  priority: string;
  bufferDays: number;
  isRecurring: boolean;
  recurrence: { type: string; days: string[]; until: string | null } | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
}

export const EMPTY_FORM: TaskFormData = {
  name: "",
  description: "",
  dueDate: null,
  url: "",
  subtasks: "",
  durationHours: "0",
  durationMinutes: "0",
  examId: "none",
  priority: "Medium",
  bufferDays: 0,
  isRecurring: false,
  recurrence: null,
};

interface Props {
  formData: TaskFormData;
  onChange: (patch: Partial<TaskFormData>) => void;
  onSubmit: (data: TaskFormData) => void;
  onDelete?: () => void;
  isEditing: boolean;
  exams?: { id: string; title: string }[];
  linkedEventTitle?: string | null;
  relativeOffsetDays?: number | null;
  scheduledRelativeTo?: string | null;
}

const INPUT =
  "w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";
const MINUTE_OPTIONS = [
  "0",
  "5",
  "10",
  "15",
  "20",
  "25",
  "30",
  "35",
  "45",
  "50",
  "55",
];

function EventLinkBadge({
  title,
  offsetDays,
}: {
  title: string;
  offsetDays?: number | null;
}) {
  const label = relativeOffsetLabel(offsetDays);
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
      <span className="text-indigo-500">🔗</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-indigo-700 truncate">{title}</p>
        {label && <p className="text-xs text-indigo-400">{label}</p>}
      </div>
    </div>
  );
}

export function TaskForm({
  formData,
  onChange,
  onSubmit,
  onDelete,
  isEditing,
  exams = [],
  linkedEventTitle,
  relativeOffsetDays,
}: Props) {
  const [isRecurring, setIsRecurring] = useState(formData.isRecurring ?? false);
  const [recurrenceType, setRecurrenceType] = useState(
    formData.recurrence?.type ?? "weekly",
  );
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>(
    formData.recurrence?.days ?? [],
  );
  const [recurrenceUntil, setRecurrenceUntil] = useState(
    formData.recurrence?.until
      ? new Date(formData.recurrence.until).toISOString().split("T")[0]
      : "",
  );

  useEffect(() => {
    setIsRecurring(formData.isRecurring ?? false);
    setRecurrenceType(formData.recurrence?.type ?? "weekly");
    setRecurrenceDays(formData.recurrence?.days ?? []);
    setRecurrenceUntil(
      formData.recurrence?.until
        ? new Date(formData.recurrence.until).toISOString().split("T")[0]
        : "",
    );
  }, [formData.isRecurring, formData.recurrence]);

  const handleSubmit = () => {
    const recurrence = isRecurring
      ? {
          type: recurrenceType,
          days: recurrenceType === "weekly" ? recurrenceDays : [],
          until: recurrenceUntil || null,
        }
      : null;
    onChange({ isRecurring, recurrence });
    onSubmit({ ...formData, isRecurring, recurrence });
  };

  return (
    <div className="flex flex-col gap-4">
      {linkedEventTitle && (
        <EventLinkBadge
          title={linkedEventTitle}
          offsetDays={relativeOffsetDays}
        />
      )}

      <FormField label="Task Name">
        <input
          type="text"
          placeholder="Enter task name"
          value={formData.name ?? ""}
          className={INPUT}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </FormField>

      <FormField label="Description">
        <input
          type="text"
          placeholder="Enter task description"
          value={formData.description ?? ""}
          className={INPUT}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </FormField>

      <FormField label="Due Date">
        <input
          type="date"
          value={
            formData.dueDate
              ? new Date(formData.dueDate).toISOString().split("T")[0]
              : ""
          }
          onChange={(e) => onChange({ dueDate: e.target.value || null })}
          className={INPUT}
        />
      </FormField>

      <FormField label="Time Estimate">
        <div className="flex gap-2">
          <select
            value={formData.durationHours ?? "0"}
            onChange={(e) => onChange({ durationHours: e.target.value })}
            className={`flex-1 ${INPUT}`}
          >
            {Array.from({ length: 9 }, (_, i) => (
              <option key={i} value={i}>
                {i}h
              </option>
            ))}
          </select>
          <select
            value={formData.durationMinutes ?? "0"}
            onChange={(e) => onChange({ durationMinutes: e.target.value })}
            className={`flex-1 ${INPUT}`}
          >
            {MINUTE_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}m
              </option>
            ))}
          </select>
        </div>
      </FormField>

      <FormField label="Priority">
        <div className="flex gap-2">
          {(["Low", "Medium", "High"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange({ priority: p })}
              className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                (formData.priority ?? "Medium") === p
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </FormField>

      <FormField label="Finish before deadline (days)">
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            max="35"
            placeholder="0"
            value={formData.bufferDays ?? ""}
            onChange={(e) =>
              onChange({ bufferDays: parseInt(e.target.value) || 0 })
            }
            className="w-24 border border-gray-200 p-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <span className="text-sm text-gray-400">days before due date</span>
        </div>
      </FormField>

      <FormField label="Study Resource URL">
        <div className="flex gap-2">
          <input
            type="url"
            placeholder="https://..."
            value={formData.url ?? ""}
            onChange={(e) => onChange({ url: e.target.value })}
            className={`flex-1 ${INPUT}`}
          />
          {formData.url && (
            <a
              href={formData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50"
            >
              🔗
            </a>
          )}
        </div>
      </FormField>

      <FormField label="Subtasks (comma separated)">
        <input
          type="text"
          placeholder="e.g. Research, Draft, Review"
          value={formData.subtasks ?? ""}
          onChange={(e) => onChange({ subtasks: e.target.value })}
          className={INPUT}
        />
      </FormField>

      {exams.length > 0 && (
        <FormField label="Link to Exam (Optional)">
          <select
            value={formData.examId ?? "none"}
            onChange={(e) => onChange({ examId: e.target.value })}
            className={INPUT}
          >
            <option value="none">General Task (No Exam)</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title}
              </option>
            ))}
          </select>
        </FormField>
      )}

      <div className="border-t pt-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={isRecurring}
            onClick={() => setIsRecurring((p) => !p)}
            className={`w-10 h-5 rounded-full transition-all relative ${isRecurring ? "bg-indigo-600" : "bg-gray-200"}`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isRecurring ? "left-5" : "left-0.5"}`}
            />
          </button>
          <span className="text-sm font-medium text-gray-600">
            {isRecurring ? "This task repeats" : "Does not repeat"}
          </span>
        </div>
        {isRecurring && (
          <RecurrencePanel
            type={recurrenceType}
            days={recurrenceDays}
            until={recurrenceUntil}
            onType={setRecurrenceType}
            onDays={setRecurrenceDays}
            onUntil={setRecurrenceUntil}
          />
        )}
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all"
        >
          {isEditing ? "Update Task" : "Create Task"}
        </button>
        {isEditing && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold hover:bg-red-100 transition-all border border-red-100"
          >
            Delete Task
          </button>
        )}
      </div>
    </div>
  );
}
