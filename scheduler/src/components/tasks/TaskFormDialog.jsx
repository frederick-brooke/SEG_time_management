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


const labelStyle = "text-[10px] font-black uppercase tracking-widest text-white/40 ml-1";
const inputStyle = "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-blue-500/40 rounded-xl transition-all";
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button className="bg-blue-600 text-white font-black rounded-xl px-8 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] transition-all uppercase tracking-widest text-xs border border-blue-400/50">
            + NEW TASK
          </Button>
        </DialogTrigger>
      )}
      

      <DialogContent className="bg-[#020617]/90 border-white/10 backdrop-blur-xl rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white">
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
            <Label htmlFor="task-name" className={labelStyle}>Task Name</Label>
            <Input
              id="task-name"
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
                placeholder="No URL attached"
                value={formData.url || ""}
                className={inputStyle}
                onChange={(e) => onFormChange({ url: e.target.value })}
              />

              {formData.url && (
                <Button variant="outline" size="icon" asChild>
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
                <SelectTrigger className="flex-1">
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

        <DialogFooter>
          <Button type="button" onClick={onSubmit} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl px-10 py-6 uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400/50 transition-all active:scale-95">
            {editingTaskId !== null ? "Update Task" : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
