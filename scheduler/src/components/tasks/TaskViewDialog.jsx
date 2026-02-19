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

export function TaskViewDialog({ task, isOpen, onClose, getPriorityStyle }) {
  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
          <DialogDescription>Task Details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-medium">Description</Label>
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

          <div>
            <Label className="text-sm font-medium">Due Date</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
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
            <Label className="text-sm font-medium">Subtasks</Label>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
              {task.subtasks?.length > 0 ? (
                task.subtasks.map((sub, index) => <li key={index}>{sub}</li>)
              ) : (
                <li>No subtasks</li>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
