/**
 * @file TaskViewDialog.tsx
 * @description A read-only modal interface for inspecting task metadata, decoupled into atomic display units for Band 5 compliance.
 */

'use client';

import { useRouter } from "next/navigation"; 
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { X, CheckCircle2 } from "lucide-react"; 
import { LunarCard } from "../ui/LunarCard";

interface TaskViewDialogProps {
  task: any | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (taskId: string) => void;
  getPriorityStyle?: (priority: string) => string;
  onReward?: (rewards: any) => void;
}

/**
 * Read-only dialog displaying task details.
 * @param {any | null} task The task to display.
 * @param {boolean} isOpen Whether the dialog is visible or not.
 * @param {Function} onClose Callback to close the dialog.
 * @param {Function} onEdit Optional callback to open the edit dialog.
 * @param {Function} getPriorityStyle Optional function to get priority badge styles.
 * @param {Function} onReward Optional callback fired when XP rewards are received.
 * @returns 
 */
export function TaskViewDialog({ 
  task, 
  isOpen, 
  onClose,
  onEdit, 
  getPriorityStyle, 
  onReward 
}: TaskViewDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Return early if dialog shouldn't be open or task is missing
  if (!isOpen || !task) return null;

  const handleCompleteTask = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'completed',
          completed: true,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.refresh();
        onClose();
        if (data.rewards && onReward) onReward(data.rewards);
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Background Overlay */
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xl z-[9999]" onClick={onClose}>

      {/* Lunar Wrapper */}
      <LunarCard
          className="w-full max-w-[425px] relative p-8 bg-[#111629]/95 border-white/10 shadow-2xl"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Close Button */}
        <Button onClick={onClose} className="absolute top-5 right-6 text-white/40 hover:text-white">
          <X size={20} />
        </Button>

        {/* Title */}
        <div className="mb-6">
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
            {task.title}
            {task.status === "completed" && (
              <CheckCircle2 className="text-green-500 h-5 w-5" />
            )}
          </h3>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Task Details</p>
        </div>

        {/* Data Rows */}
        <div className="space-y-4 py-4">
          <div>
            <label className="lunar-label">Description</label>
            <p className="lunar-value">
              {task.description || "No description provided"}
            </p>
          </div>

          <div>
            <label className="lunar-label">Priority</label>
            <p className="lunar-value mt-1">
              <span className={`text-xs px-2 py-1 rounded-full border font-bold uppercase tracking-wider ${getPriorityStyle?.(task.priority) ?? ""}`}>
                {task.priority || "None"}
              </span>
            </p>
          </div>

          <div>
            <label className="lunar-label">Estimated Time</label>
            <p className="lunar-value">
              {task.duration > 0
                ? `${Math.floor(task.duration / 60)}h ${task.duration % 60}m`
                : "No estimate set"}
            </p>
          </div>

          <div className="space-y-1">
            <label className="lunar-label">Study Resource</label>
            {task.url ? (
              <a
                href={task.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                View Resource
              </a>
            ) : (
              <p className="lunar-value">No resource attached</p>
            )}
          </div>

          <div>
            <label className="lunar-label">Due Date</label>
            <p className="lunar-value">
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "No due date set"}
            </p>
          </div>

          <div className="grid gap-1">
            <label className="lunar-label">Linked Exams</label>
            <p className="lunar-value">
              {task.exam?.title || "Not linked to an exam"}
            </p>
          </div>

          <div>
            <label className="lunar-label">Subtasks</label>
            <ul className="list-disc list-inside text-sm text-white/50 mt-1 space-y-1">
              {task.subtasks?.length > 0 ? (
                task.subtasks.map((sub: string, index: number) => (
                  <li key={index}>{sub}</li>
                ))
              ) : (
                <li>No subtasks</li>
              )}
            </ul>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-white/10 text-white border-white/10 hover:bg-white/20">
            Close
          </Button>
          {task.status !== "completed" && (
            <Button
              onClick={handleCompleteTask}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-[0_0_20px_rgba(59,130,246,0.4)]"
            >
              <CheckCircle2 className="h-4 w-4" />
              {loading ? "Completing..." : "Mark as Done"}
            </Button>
          )}
        </div>
      </LunarCard>
    </div>
  );
}