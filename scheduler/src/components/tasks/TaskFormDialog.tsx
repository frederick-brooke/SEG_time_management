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


const labelStyle = "lunar-label"
const cardStyle = "lunar-card"


export function TaskFormDialog({
  isOpen,
  onOpenChange,
  editingTaskId,
  formData,
  onFormChange,
  onSubmit,
  exams = [],
  showTrigger = true,
}) {
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
            className="lunar-card relative p-5"
            onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button onClick={() => onOpenChange(false)} className="absolute top-5 right-6 text-white/40 hover:text-white">
            <X size={20} />
          </button>

          <div className="mb-8">
            <h3 className="lunar-header">
              {editingTaskId !== null ? "Edit Task" : "Create New Task"}
            </h3>
            <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
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
                  <SelectContent className="lunar-select-content">
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
                  <SelectContent className="lunar-select-content">
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
                <SelectContent className="lunar-select-content">
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
                variant="outline"
                type="single"
                value={formData.priority}
                onValueChange={(value) => onFormChange({ priority: value })}
                className="flex w-full h-12 items-center gap-1 p-[2px] bg-white/5 rounded-xl border border-white/10 overflow-hidden"
              >
                <ToggleGroupItem 
                  value="Low"
                  className="flex-1 h-full rounded-lg text-white/40 data-[state=on]:bg-emerald-500/20 data-[state=on]:text-emerald-400 data-[state=on]:border-emerald-500/50 border border-transparent transition-all font-bold">
                    Low
                  </ToggleGroupItem>
                <ToggleGroupItem 
                  value="Medium"
                  className="flex-1 h-full rounded-lg text-white/40 data-[state=on]:bg-amber-500/20 data-[state=on]:text-amber-400 data-[state=on]:border-amber-500/50 border border-transparent transition-all font-bold">
                    Medium
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="High"
                  className="flex-1 h-full rounded-lg text-white/40 data-[state=on]:bg-red-500/20 data-[state=on]:text-red-400 data-[state=on]:border-red-500/50 border border-transparent transition-all font-bold">
                    High
                  </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button 
              type="button" 
              onClick={() => onSubmit(formData)} className="lunar-btn-primary w-full text-sm">
              {editingTaskId !== null ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </LunarCard>
      </div>
    </>
  );
}
