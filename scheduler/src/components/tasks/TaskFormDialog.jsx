import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "components/ui/dialog";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Button } from "components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "components/ui/toggle-group";

export function TaskFormDialog({
  isOpen,
  onOpenChange,
  editingTaskId,
  formData,
  onFormChange,
  onSubmit,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>New</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingTaskId !== null ? "Edit Task" : "Create New Task"}
          </DialogTitle>
          <DialogDescription>
            {editingTaskId !== null
              ? "Update the task details below"
              : "Add a new task to your list"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="task-name">Task Name</Label>
            <Input
              id="task-name"
              placeholder="Enter task name"
              value={formData.name}
              onChange={(e) => onFormChange({ name: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="task-description">Task Description</Label>
            <Input
              id="task-description"
              placeholder="Enter task description"
              value={formData.description}
              onChange={(e) => onFormChange({ description: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="task-due-date">Due Date</Label>
            <Input
              id="task-due-date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => onFormChange({ dueDate: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="subtasks">Subtasks (comma separated)</Label>
            <Input
              id="subtasks"
              placeholder="e.g. Research, Edit"
              value={formData.subtasks}
              onChange={(e) => onFormChange({ subtasks: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label>Time Estimate</Label>
            <div className="flex gap-2">
              <Select
                value={formData.durationHours}
                onValueChange={(value) =>
                  onFormChange({ durationHours: value })
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Hours" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(9)].map((_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i}h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={formData.durationMinutes}
                onValueChange={(value) =>
                  onFormChange({ durationMinutes: value })
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Mins" />
                </SelectTrigger>
                <SelectContent>
                  {[
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
                  ].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}m
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Task Priority</Label>
            <ToggleGroup
              variant="outline"
              type="single"
              value={formData.priority}
              onValueChange={(value) => onFormChange({ priority: value })}
            >
              <ToggleGroupItem value="Low">Low</ToggleGroupItem>
              <ToggleGroupItem value="Medium">Medium</ToggleGroupItem>
              <ToggleGroupItem value="High">High</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={onSubmit}>
            {editingTaskId !== null ? "Update Task" : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
