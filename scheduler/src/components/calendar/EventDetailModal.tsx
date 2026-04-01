"use client";

import { format } from "date-fns";
import { MapPin } from "lucide-react";
import { TaskForm, type TaskFormData } from "@/components/tasks/TaskForm";
import { Button } from "../ui/Button";
import EventForm from "@/components/calendar/EventForm";

// Colour maps for the category/priority indicator stripe at the top of the modal.
const CATEGORY_COLORS: Record<string, string> = {
  Lecture: "#818cf8",
  "Individual Study": "#34d399",
  Exam: "#f87171",
  Personal: "#fbbf24",
  Lab: "#a78bfa",
  Google: "#60a5fa",
};

const TASK_COLORS: Record<string, string> = {
  High: "#f87171",
  Medium: "#fb923c",
  Low: "#4ade80",
};

// types
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

/**
 * Renders the appropriate view based on selectedEvent and editing state:
 * - No selectedEvent → new event form
 * - selectedEvent + isEditing → edit event form
 * - selectedEvent + isTaskEditOpen → task edit form
 * - selectedEvent only → task or event detail view
 */
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

  const isModuleEvent = selectedEvent?.isModuleEvent;
  const isModuleTask = selectedEvent?.isModuleTask;
  const isGroupEvent = selectedEvent?.isGroupEvent;
  const isGroupTask = selectedEvent?.isGroupTask;
  const isModule = isModuleEvent || isModuleTask;
  const isGroup = isGroupEvent || isGroupTask;
  const canEdit = !isModule;

  const cleanTitle = selectedEvent?.title?.replace(/^\[.*?\]\s*/, "") || "";

  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 backdrop-blur-md z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-[#111118] border border-white/[0.07] p-8 rounded-[32px] w-full max-w-md relative max-h-[90vh] overflow-y-auto shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_32px_64px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          onClick={onClose}
          className="absolute top-6 right-6 text-white/30 hover:text-white/80 text-xl transition-colors"
        >
          ✕
        </Button>

        {/* detail view */}
        {selectedEvent && !isEditing && !isTaskEditOpen ? (
          <div className="pt-2">
            <div
              className="w-12 h-1.5 rounded-full mb-6"
              style={{
                backgroundColor:
                  selectedEvent._type === "task"
                    ? TASK_COLORS[selectedEvent.priority] || "#4ade80"
                    : CATEGORY_COLORS[selectedEvent.category] || "#60a5fa",
              }}
            />

            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {selectedEvent._type === "task" && (
                <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-1 rounded-full font-bold border border-emerald-500/20 tracking-wider">
                  TASK
                </span>
              )}
              {isModule && (
                <span className="text-xs bg-purple-500/15 text-purple-400 px-2 py-1 rounded-full font-bold border border-purple-500/20 tracking-wider">
                  MODULE
                </span>
              )}
              {isGroup && (
                <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-1 rounded-full font-bold border border-blue-500/20 tracking-wider">
                  GROUP
                </span>
              )}
              <h3 className="text-3xl font-black text-white leading-tight w-full mt-1">
                {cleanTitle}
              </h3>
            </div>

            <p className="text-white/40 text-sm mb-4 font-medium">
              {format(selectedEvent.start, "EEEE, MMMM do · h:mm a")}
            </p>

            {selectedEvent.destLocationName && (
              <div className="flex items-center gap-2 text-sm text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3 py-2 rounded-lg mb-6 w-fit">
                <MapPin size={16} />
                <span className="font-bold">{selectedEvent.destLocationName}</span>
              </div>
            )}

            {selectedEvent._type === "task" ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <span>⏱</span>
                  <span>{selectedEvent.duration} mins</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <span>🎯</span>
                  <span>{selectedEvent.priority} priority</span>
                </div>
                {selectedEvent.scheduledRelativeTo && (
                  <div className="px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-300 font-medium flex items-center gap-2">
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
                  <div className="px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-300 font-medium flex items-center gap-2">
                    <span>🔁</span>
                    <span>Recurring · {selectedEvent.recurrence?.type}</span>
                  </div>
                )}
                {selectedEvent.completed && (
                  <div className="px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 font-medium">
                    ✓ Completed
                  </div>
                )}

                {canEdit ? (
                  <>
                    <Button onClick={() => onSetTaskEdit(true)} className="w-full bg-white text-gray-900 py-4 rounded-2xl font-bold hover:bg-white/90 transition-all mt-2">
                      Edit Task
                    </Button>
                    <Button onClick={onDeleteTask} className="w-full bg-red-500/10 text-red-400 border border-red-500/20 py-4 rounded-2xl font-bold hover:bg-red-500/20 transition-all">
                      Delete Task
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-white/30 text-center mt-4 border border-white/10 bg-white/5 p-3 rounded-xl">
                    🔒 This task belongs to a module. If you are the module owner, edit it from the Modules page.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {selectedEvent.isRecurring && (
                  <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300 font-medium flex items-center gap-2">
                    <span>🔁</span>
                    <span>Recurring series</span>
                  </div>
                )}
                {selectedEvent.description && (
                  <p className="text-white/50 text-sm">{selectedEvent.description}</p>
                )}

                {canEdit ? (
                  <>
                    <Button onClick={() => onSetEditing(true)} className="w-full bg-white text-gray-900 py-4 rounded-2xl font-bold hover:bg-white/90 transition-all mt-2">
                      Edit Event
                    </Button>
                    {(selectedEvent.recurrence?.type && selectedEvent.recurrence.type !== "none") || selectedEvent.isRecurring ? (
                      <div className="flex flex-col gap-2">
                        <Button onClick={() => onDeleteEvent("single")} className="bg-red-500/10 text-red-400 border border-red-500/20 py-3 rounded-2xl font-bold hover:bg-red-500/20 transition-all text-sm">
                          Delete Only This Instance
                        </Button>
                        <Button onClick={() => onDeleteEvent("series")} className="bg-red-500 text-white py-3 rounded-2xl font-bold hover:bg-red-600 transition-all text-sm">
                          Delete Entire Series
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => onDeleteEvent("series")} className="bg-red-500/10 text-red-400 border border-red-500/20 py-4 rounded-2xl font-bold hover:bg-red-500/20 transition-all">
                        Delete Event
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-white/30 text-center mt-4 border border-white/10 bg-white/5 p-3 rounded-xl">
                    🔒 This event belongs to a module. If you are the module owner, edit it from the Modules page.
                  </p>
                )}
              </div>
            )}
          </div>

        ) : /* task edit form */
        selectedEvent && isTaskEditOpen ? (
          <div>
            <Button onClick={() => onSetTaskEdit(false)} className="flex items-center gap-2 text-sm text-white/30 hover:text-white/70 mb-6 transition-colors">
              ← Back
            </Button>
            <h3 className="text-2xl font-black mb-6 text-white">Edit Task</h3>
            <TaskForm
              isOpen={true}
              onOpenChange={(open) => { 
                if (!open) onSetTaskEdit(false); 
              }}
              showTrigger={false}
              editingTaskId={selectedEvent.id}
              formData={taskFormData}
              onFormChange={onFormChange}
              onSubmit={onTaskSubmit}
              exams={exams}
            />
          </div>

        ) : /* new event form */
        !selectedEvent ? (
          <div>
            <h3 className="text-2xl font-black mb-8 text-white">New Schedule</h3>
            <EventForm userId={userId} initialEvent={null} initialStartDate={selectedDate} existingEvents={events} onSuccess={onEventSuccess} />
          </div>

        ) : (
          /* edit event form */
          <div>
            <h3 className="text-2xl font-black mb-8 text-white">Modify Event</h3>
            <EventForm userId={userId} initialEvent={selectedEvent} initialStartDate={selectedDate} existingEvents={events} onSuccess={onEventSuccess} />
          </div>
        )}
      </div>
    </div>
  );
}