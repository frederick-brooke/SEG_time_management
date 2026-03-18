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


const labelStyle = "text-[10px] font-bold text-blue-400/80 uppercase tracking-widest";
const inputStyle = "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-blue-500/40 rounded-xl transition-all [color-scheme:dark]";
const selectStyle = "bg-[#0a0f1d] border-white/10 text-white rounded-xl focus:ring-2 focus:ring-blue-500/40";

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
          className="bg-blue-600 text-white font-black rounded-xl px-8 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all uppercase tracking-widest text-xs border border-blue-400/50">
          + NEW TASK
        </Button>
      )}

      <div className={`fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xl z-[9999] ${!isOpen && 'hidden'}`} 
        onClick={(e) => {
            if (e.target === e.currentTarget) onOpenChange(false)
        }}>
        <LunarCard
            className="w-full max-w-[380px] relative p-6 bg-[#111629]/95 border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button onClick={() => onOpenChange(false)} className="absolute top-5 right-6 text-white/40 hover:text-white">
            <X size={20} />
          </button>

          <div className="mb-8">
            <h3 className="text-2xl font-black uppercase tracking-tighter text-white">
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
              <Label htmlFor="task-name" className={labelStyle}>Task Name</Label>
              <Input
                id="task-name"
                type="text"
                placeholder="Enter task name"
                value={formData.name || ""}
                className={inputStyle}
                onChange={(e) => onFormChange({ name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="task-description" className={labelStyle}>Task Description</Label>
              <Input
                id="task-description"
                type="text"
                placeholder="Enter task description"
                value={formData.description || ""}
                className={inputStyle}
                onChange={(e) => onFormChange({ description: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="task-due-date" className={labelStyle}>Due Date</Label>
              <Input
                id="task-due-date"
                type="date"
                value={formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0]: ""}
                className={inputStyle}
                onChange={(e) => onFormChange({ dueDate: e.target.value })}

              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="task-url" className={labelStyle}>Study Resource URL</Label>
              <div className="flex gap-2">
                <Input
                  id="task-url"
                  type="text"
                  placeholder="No URL attached"
                  value={formData.url || ""}
                  className={inputStyle}
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
              <Label htmlFor="subtasks" className={labelStyle}>Subtasks (comma separated)</Label>
              <Input
                id="subtasks"
                type="text"
                placeholder="e.g. Research, Edit"
                value={formData.subtasks || ""}
                className={inputStyle}
                onChange={(e) => onFormChange({ subtasks: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label className={labelStyle}>Time Estimate</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.durationHours}
                  onValueChange={(value) =>
                    onFormChange({ durationHours: value })
                  }
                >
                  <SelectTrigger className={inputStyle}>
                    <SelectValue placeholder="Hours" />
                  </SelectTrigger>
                  <SelectContent className={selectStyle}>
                    {[...Array(9)].map((_, i) => (
                      <SelectItem key={i} value={i.toString()} className={selectStyle}>
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
                  <SelectTrigger className={selectStyle}>
                    <SelectValue placeholder="Mins" className={selectStyle}/>
                  </SelectTrigger>
                  <SelectContent className={selectStyle}>
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
                      <SelectItem key={m} value={m} className={selectStyle}>
                        {m}m
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="exam-link" className={labelStyle}>Link to Exam (Optional)</Label>
              <Select
                value={formData.examId || "none"}
                onValueChange={(value) => onFormChange({ examId: value })}
                className={selectStyle}
              >
                <SelectTrigger id="exam-link" className={selectStyle}>
                  <SelectValue placeholder="Select and exam" className={selectStyle}/>
                </SelectTrigger>
                <SelectContent className={selectStyle}>
                  <SelectItem value="none" className={selectStyle}>General Task (No Exam)</SelectItem>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id} className={selectStyle}>
                      {exam.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className={labelStyle}>Task Priority</Label>
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
              onClick={() => onSubmit(formData)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl px-10 py-6 uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400/50 transition-all active:scale-95">
              {editingTaskId !== null ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </LunarCard>
      </div>
    </>
  );
}
