"use client";
import { useRef } from "react";
import { TaskForm, type TaskFormData } from "./TaskForm";

interface TaskFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingTaskId: string | null;
  formData: TaskFormData;
  onFormChange: (patch: Partial<TaskFormData>) => void;
  onSubmit: (data: TaskFormData) => void;
  onDelete?: () => void;
  exams?: { id: string; title: string }[];
  showTrigger?: boolean;
  // Extra read-only context when editing an event-linked task
  linkedEventTitle?: string | null;
  relativeOffsetDays?: number | null;
  scheduledRelativeTo?: string | null;
}

export function TaskFormDialog({
  isOpen,
  onOpenChange,
  editingTaskId,
  formData,
  onFormChange,
  onSubmit,
  onDelete,
  exams = [],
  showTrigger = true,
  linkedEventTitle,
  relativeOffsetDays,
  scheduledRelativeTo,
}: TaskFormDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Trigger button */}
      {showTrigger && !isOpen && (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          className="px-4 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all"
        >
          New
        </button>
      )}

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            ref={overlayRef}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            onClick={() => onOpenChange(false)}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-white rounded-[28px] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-2">
                <div>
                  <h2 className="text-xl font-black text-gray-900">
                    {editingTaskId !== null ? "Edit Task" : "New Task"}
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {editingTaskId !== null
                      ? "Update the details below"
                      : "Add a new task to your list"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="text-gray-400 hover:text-black text-xl leading-none"
                >
                  ✕
                </button>
              </div>

              {/* Body — shared TaskForm */}
              <div className="px-6 pb-6 mt-3">
                <TaskForm
                  formData={formData}
                  onChange={onFormChange}
                  onSubmit={(data) => {
                    onSubmit(data);
                    onOpenChange(false);
                  }}
                  onDelete={onDelete}
                  isEditing={editingTaskId !== null}
                  exams={exams}
                  linkedEventTitle={linkedEventTitle}
                  relativeOffsetDays={relativeOffsetDays}
                  scheduledRelativeTo={scheduledRelativeTo}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
