import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { LunarCard } from "../ui/lunar-card";
import { X } from "lucide-react";


interface TaskFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingTaskId: string | null;
  formData: any;
  onFormChange: (patch: any) => void;
  onSubmit: (date: any) => void;
  exams?: { id: string; title: string }[];
  showTrigger?: boolean;
}

export function TaskForm({
  isOpen,
  onOpenChange,
  editingTaskId,
  formData,
  onFormChange,
  onSubmit,
  exams = [],
  showTrigger = true,
}: TaskFormProps) {

  const handleAction = () => {
    if (!formData.name?.trim()) {
      return;
    }
    onSubmit(formData);
  }

  return (
    <>
      {showTrigger && (
        <Button 
          onClick={() => onOpenChange(true)}
          className="lunar-button-primary">
          + NEW TASK
        </Button>
      )}

      <div className={`lunar-overlay ${!isOpen && 'hidden'}`} 
        onClick={(e) => {
            if (e.target === e.currentTarget) onOpenChange(false)
        }}>
        <LunarCard
            className="relative p-5 w-full w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button onClick={() => onOpenChange(false)} className="lunar-close-button">
            <X size={20} />
          </button>

          <div className="mb-8">
            <h3 className="lunar-header">
              {editingTaskId !== null ? "Edit Task" : "Create New Task"}
            </h3>
            <p className="lunar-form-subtitle">
              {editingTaskId !== null
                ? "Update the task details below"
                : "Add a new task to your list"}
            </p>
          </div>

          <div className="grid gap-2 py-2">
            <div className="grid gap-2">
              <Label htmlFor="task-name" className="lunar-label">Task Name</Label>
              <Input
                id="task-name"
                type="text"
                placeholder="Enter task name"
                value={formData.name || ""}
                className="lunar-input"
                onChange={(e) => onFormChange({ name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="task-description" className="lunar-label">Task Description</Label>
              <Input
                id="task-description"
                type="text"
                placeholder="Enter task description"
                value={formData.description || ""}
                className="lunar-input"
                onChange={(e) => onFormChange({ description: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="task-due-date" className="lunar-label">Due Date</Label>
              <Input
                id="task-due-date"
                type="date"
                value={formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0]: ""}
                className="lunar-input"
                onChange={(e) => onFormChange({ dueDate: e.target.value })}

              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="task-url" className="lunar-label">Study Resource URL</Label>
              <div className="flex gap-2">
                <Input
                  id="task-url"
                  type="text"
                  placeholder="No URL attached"
                  value={formData.url || ""}
                  className="lunar-input"
                  onChange={(e) => onFormChange({ url: e.target.value })}
                />

                {formData.url && (
                  <Button variant="outline" size="icon" asChild className="bg-white/5 border-white/10 text-white">
                    <a href={formData.url} target="_blank" rel="noopener noreferrer">
                      🔗
                    </a>
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subtasks" className="lunar-label">Subtasks (comma separated)</Label>
              <Input
                id="subtasks"
                type="text"
                placeholder="e.g. Research, Edit"
                value={formData.subtasks || ""}
                className="lunar-input"
                onChange={(e) => onFormChange({ subtasks: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label className="lunar-label">Time Estimate</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.durationHours}
                  onValueChange={(value) =>
                    onFormChange({ durationHours: value })
                  }
                >
                  <SelectTrigger className="lunar-input">
                    <SelectValue placeholder="Hours"/>
                  </SelectTrigger>
                  <SelectContent className="lunar-select-content z-[9999]">
                    {[...Array(9)].map((_, i) => (
                      <SelectItem key={i} value={i.toString()} className="lunar-select-item">
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
                  <SelectTrigger className="lunar-input">
                    <SelectValue placeholder="Mins"/>
                  </SelectTrigger>
                  <SelectContent className="lunar-select-content z-[9999]">
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
                      <SelectItem key={m} value={m} className="lunar-select-item">
                        {m}m
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="exam-link" className="lunar-label">Link to Exam (Optional)</Label>
              <Select
                value={formData.examId || "none"}
                onValueChange={(value) => onFormChange({ examId: value })}
                className="lunar-select-trigger"
              >
                <SelectTrigger id="exam-link" className="lunar-input">
                  <SelectValue placeholder="Select and exam"/>
                </SelectTrigger>
                <SelectContent className="lunar-select-content z-[9999]">
                  <SelectItem value="none" className="lunar-select-item">General Task (No Exam)</SelectItem>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id} className="lunar-select-item">
                      {exam.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className="lunar-label">Task Priority</Label>
              <ToggleGroup
                type="single"
                value={formData.priority}
                onValueChange={(value) => onFormChange({ priority: value })}
                className="flex w-full h-12 items-center gap-1 p-[2px] bg-white/5 rounded-xl border border-white/10 overflow-hidden"
              >
                <ToggleGroupItem 
                  value="Low"
                  className="lunar-toggle-item lunar-toggle-low">
                    Low
                  </ToggleGroupItem>
                <ToggleGroupItem 
                  value="Medium"
                  className="lunar-toggle-item lunar-toggle-medium">
                    Medium
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="High"
                  className="lunar-toggle-item lunar-toggle-high">
                    High
                  </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button 
              type="button" 
              onClick={handleAction} className="lunar-button-primary w-full text-sm">
              {editingTaskId !== null ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </LunarCard>
      </div>
    </>
  );
}
