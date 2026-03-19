"use client";
import { format } from "date-fns";
import { TaskForm, type TaskFormData } from "@/components/tasks/TaskForm";
import EventForm from "@/src/components/map/EventForm";

const CATEGORY_COLORS: Record<string, string> = {
  Lecture: "#6366f1",
  "Individual Study": "#10b981",
  Exam: "#ef4444",
  Personal: "#f59e0b",
  Lab: "#8b5cf6",
  Google: "#4285F4",
};
const TASK_COLORS: Record<string, string> = {
  High: "#dc2626",
  Medium: "#ea580c",
  Low: "#16a34a",
};

interface EventDetailModalProps {
  selectedEvent: any;
  isEditing: boolean;
  isTaskEditOpen: boolean;
  taskFormData: TaskFormData;
  selectedDate: string;
  userId: string;
  events: any[];
  exams: any[];
  onClose: () => void;
  onSetEditing: (v: boolean) => void;
  onSetTaskEdit: (v: boolean) => void;
  onFormChange: (changes: any) => void;
  onTaskSubmit: (merged?: any) => void;
  onDeleteTask: () => void;
  onDeleteEvent: (mode: "single" | "series") => void;
  onEventSuccess: () => void;
}

export default function EventDetailModal({
  selectedEvent,
  isEditing,
  isTaskEditOpen,
  taskFormData,
  selectedDate,
  userId,
  events,
  exams,
  onClose,
  onSetEditing,
  onSetTaskEdit,
  onFormChange,
  onTaskSubmit,
  onDeleteTask,
  onDeleteEvent,
  onEventSuccess,
}: EventDetailModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-md z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-black text-xl"
        >
          ✕
        </button>

        {/* ── Task or event detail view ── */}
        {selectedEvent && !isEditing && !isTaskEditOpen ? (
          <div className="pt-2">
            <div
              className="w-12 h-1.5 rounded-full mb-6"
              style={{
                backgroundColor:
                  selectedEvent._type === "task"
                    ? TASK_COLORS[selectedEvent.priority] || "#16a34a"
                    : CATEGORY_COLORS[selectedEvent.category] || "#3b82f6",
              }}
            />
            <div className="flex items-center gap-2 mb-2">
              {selectedEvent._type === "task" && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                  TASK
                </span>
              )}
              <h3 className="text-3xl font-black text-gray-900 leading-tight">
                {selectedEvent.title}
              </h3>
            </div>
            <p className="text-gray-500 text-sm mb-4 font-medium">
              {format(selectedEvent.start, "EEEE, MMMM do · h:mm a")}
            </p>

            {selectedEvent._type === "task" ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>⏱</span>
                  <span>{selectedEvent.duration} mins</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>🎯</span>
                  <span>{selectedEvent.priority} priority</span>
                </div>
                {selectedEvent.scheduledRelativeTo && (
                  <div className="px-3 py-2 bg-indigo-50 rounded-lg text-xs text-indigo-700 font-medium flex items-center gap-2">
                    <span>🔗</span>
                    <span>
                      Linked to event ·{" "}
                      {selectedEvent.relativeOffsetDays === 0
                        ? "same day"
                        : selectedEvent.relativeOffsetDays < 0
                          ? `${Math.abs(selectedEvent.relativeOffsetDays)} day${Math.abs(selectedEvent.relativeOffsetDays) !== 1 ? "s" : ""} before`
                          : `${selectedEvent.relativeOffsetDays} day${selectedEvent.relativeOffsetDays !== 1 ? "s" : ""} after`}
                    </span>
                  </div>
                )}
                {selectedEvent.isRecurring && (
                  <div className="px-3 py-2 bg-indigo-50 rounded-lg text-xs text-indigo-700 font-medium flex items-center gap-2">
                    <span>🔁</span>
                    <span>Recurring · {selectedEvent.recurrence?.type}</span>
                  </div>
                )}
                {selectedEvent.completed && (
                  <div className="px-3 py-2 bg-green-50 rounded-lg text-xs text-green-700 font-medium">
                    ✓ Completed
                  </div>
                )}
                <button
                  onClick={() => onSetTaskEdit(true)}
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all"
                >
                  Edit Task
                </button>
                <button
                  onClick={onDeleteTask}
                  className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold hover:bg-red-100 transition-all"
                >
                  Delete Task
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {selectedEvent.isRecurring && (
                  <div className="px-3 py-2 bg-blue-50 rounded-lg text-xs text-blue-700 font-medium flex items-center gap-2">
                    <span>🔁</span>
                    <span>Recurring series</span>
                  </div>
                )}
                {selectedEvent.description && (
                  <p className="text-gray-600 text-sm">
                    {selectedEvent.description}
                  </p>
                )}
                <button
                  onClick={() => onSetEditing(true)}
                  className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all"
                >
                  Edit Event
                </button>
                {(selectedEvent.recurrence?.type &&
                  selectedEvent.recurrence.type !== "none") ||
                selectedEvent.isRecurring ? (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => onDeleteEvent("single")}
                      className="bg-red-50 text-red-600 py-3 rounded-2xl font-bold hover:bg-red-100 transition-all text-sm"
                    >
                      Delete Only This Instance
                    </button>
                    <button
                      onClick={() => onDeleteEvent("series")}
                      className="bg-red-600 text-white py-3 rounded-2xl font-bold hover:bg-red-700 transition-all text-sm"
                    >
                      Delete Entire Series
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onDeleteEvent("series")}
                    className="bg-red-50 text-red-600 py-4 rounded-2xl font-bold hover:bg-red-100 transition-all"
                  >
                    Delete Event
                  </button>
                )}
              </div>
            )}
          </div>
        ) : /* ── Task edit form ── */
        selectedEvent && isTaskEditOpen ? (
          <div>
            <button
              onClick={() => onSetTaskEdit(false)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6"
            >
              ← Back
            </button>
            <h3 className="text-2xl font-black mb-6 text-gray-900">
              Edit Task
            </h3>
            <TaskForm
              formData={taskFormData}
              onChange={onFormChange}
              onSubmit={onTaskSubmit}
              onDelete={onDeleteTask}
              isEditing={true}
              exams={exams}
              linkedEventTitle={
                selectedEvent.eventId
                  ? (events.find((e) => e.id === selectedEvent.eventId)
                      ?.title ?? null)
                  : null
              }
              relativeOffsetDays={selectedEvent.relativeOffsetDays ?? null}
              scheduledRelativeTo={selectedEvent.scheduledRelativeTo ?? null}
            />
          </div>
        ) : /* ── New event form ── */
        !selectedEvent ? (
          <div>
            <h3 className="text-2xl font-black mb-8 text-gray-900">
              New Schedule
            </h3>
            <EventForm
              userId={userId}
              initialEvent={null}
              initialStartDate={selectedDate}
              existingEvents={events}
              onSuccess={onEventSuccess}
            />
          </div>
        ) : (
          /* ── Edit event form ── */
          <div>
            <h3 className="text-2xl font-black mb-8 text-gray-900">
              Modify Event
            </h3>
            <EventForm
              userId={userId}
              initialEvent={selectedEvent}
              initialStartDate={selectedDate}
              existingEvents={events}
              onSuccess={onEventSuccess}
            />
          </div>
        )}
      </div>
    </div>
  );
}
