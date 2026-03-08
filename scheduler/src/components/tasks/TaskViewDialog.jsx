'use client';

import { useRouter } from "next/navigation"; 
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import { Label } from "components/ui/label";
import { Button } from "components/ui/button";
import { CheckCircle2 } from "lucide-react"; // Added for a nice icon

export function TaskViewDialog({ task, isOpen, onClose, getPriorityStyle }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!task) return null;

  /**
   * Handles updating the task to 'completed' and awarding XP
   */
  const handleCompleteTask = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'completed',
          completed: true // This is the trigger for your backend XP logic
        })
      });

      if (res.ok) {
        // Refresh the page data so the XP bar updates immediately
        router.refresh(); 
        // Close the dialog after successful completion
        onClose(); 
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {task.title}
            {task.status === "completed" && (
              <CheckCircle2 className="text-green-500 h-5 w-5" />
            )}
          </DialogTitle>
          <DialogDescription>Task Details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-bold text-gray-900">Description</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {task.description || "No description provided"}
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium">Priority</Label>
            <p className="text-sm mt-1">
              <span
                className={`text-xs px-2 py-1 rounded-full border font-bold uppercase tracking-wider ${getPriorityStyle(task.priority)}`}
              >
                {task.priority}
              </span>
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium">Estimated Time</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {task.duration > 0
                ? `${Math.floor(task.duration / 60)}h ${task.duration % 60}m`
                : "No estimate set"}
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">Study Resource</h4>
            {task.url ? (
              <a
                href={task.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                View Resource
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">No resource attached</p>
            )}
          </div>
          
          <div>
            <Label className="text-sm font-bold text-gray-900">Due Date</Label>
            <p className="text-sm text-muted-foreground mt-1">
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
            <p className="text-sm font-semibold">Linked Exams</p>
            <p className="text-sm text-muted-foreground">
              {task.exam?.title || "Not linked to an exam"}
            </p>
          </div>

          <div>
            <Label className="text-sm font-bold text-gray-900">Subtasks</Label>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-1 space-y-1">
              {task.subtasks?.length > 0 ? (
                task.subtasks.map((sub, index) => <li key={index}>{sub}</li>)
              ) : (
                <li>No subtasks</li>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {/* Close Button */}
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>

          {/* Complete Task Button - Only shows if not already completed */}
          {task.status !== "completed" && (
            <Button 
              onClick={handleCompleteTask} 
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              {loading ? "Completing..." : "Mark as Done"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}