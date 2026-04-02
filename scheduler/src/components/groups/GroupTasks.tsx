/**
 * @file GroupTasks.tsx
 * @description Displays a scrollable list of group tasks with real-time member progress badges.
 * Provides controls for users to toggle their own completion status and for any member 
 * to edit or delete the global shared task.
 */

'use client';

import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { ListTodo, Pencil, Trash2, CheckCircle, Circle } from "lucide-react";
import { formatDuration, formatTaskDate } from "@/lib/format";

/**
 * Represents a group member associated with a task's progress.
 */
interface TaskMember {
  id: string;
  username: string;
  fname?: string | null;
  lname?: string | null;
}

/**
 * Represents the data for a shared group task, including member progress.
 */
interface GroupTaskData {
  groupTaskGroupId: string;
  title: string;
  description?: string | null;
  dueDate?: string | Date | null;
  priority: string;
  duration?: number;
  currentUserCompleted: boolean;
  completedMembers: TaskMember[];
  inProgressMembers: TaskMember[];
}

/**
 * Props for the MemberProgressBadge component.
 */
interface MemberProgressBadgeProps {
  count: number;
  members: TaskMember[];
  label: string;
  color: "green" | "amber";
}

/**
 * Props for the TaskItem component.
 */
interface TaskItemProps {
  task: GroupTaskData;
  onEdit: (task: GroupTaskData) => void;
  onDelete: (groupId: string) => void;
  onToggleComplete: (task: GroupTaskData) => void;
}

/**
 * Props for the main GroupTasks component.
 */
interface GroupTasksProps {
  tasksWithProgress: GroupTaskData[];
  onEdit: (task: GroupTaskData) => void;
  onDelete: (groupId: string) => void;
  onToggleComplete: (task: GroupTaskData) => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  High:   'bg-red-500/10 text-red-400 border-red-500/20 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]',
  Low:    'bg-white/10 text-white/70 border-white/20 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]',
};

/**
 * Clickable badge showing member names in a dropdown popover.
 * Used to display who has completed or is in-progress on a task.
 *
 * @param {MemberProgressBadgeProps} props - Component props.
 * @returns {JSX.Element} The progress badge UI.
 */
function MemberProgressBadge({ count, members, label, color }: MemberProgressBadgeProps) {
  const [open, setOpen] = useState(false);
  
  const styles = color === 'green'
    ? { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20', dot: 'bg-emerald-500' }
    : { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20', dot: 'bg-amber-500' };

  return (
    <div className="relative inline-block">
      <Button onClick={() => setOpen((v) => !v)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider transition-colors ${styles.badge}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} /> {count} {label}
      </Button>
      
      {open && members.length > 0 && (
        <div className="absolute bottom-full mb-2 left-0 z-20 bg-[#111629] border border-white/20 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-3 min-w-[160px] animate-in fade-in slide-in-from-bottom-2">
          <p className="lunar-label mb-2 text-white/80">{label}</p>
          <ul className="space-y-1">
            {members.map((m) => (
              <li key={m.id} className="text-xs text-white/60 font-medium">{m.fname || m.username} {m.lname}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Renders the metadata row for a task (due date, priority, duration).
 *
 * @param {{ task: GroupTaskData }} props - Component props.
 * @returns {JSX.Element} The metadata UI block.
 */
function TaskMetadata({ task }: { task: GroupTaskData }) {
  return (
    <div className="flex items-center gap-3 mt-3 flex-wrap ml-8">
      {task.dueDate && <span className="text-[10px] text-white/40 font-medium">📅 Due: {formatTaskDate(task.dueDate)}</span>}
      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider ${PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.Low}`}>
        {task.priority}
      </span>
      {(task.duration ?? 0) > 0 && <span className="text-[10px] text-white/40 font-medium">⏱️ {formatDuration(task.duration as number)}</span>}
    </div>
  );
}

/**
 * Renders a single group task item including controls and progress.
 *
 * @param {TaskItemProps} props - Component props.
 * @returns {JSX.Element} The task row UI.
 */
function TaskItem({ task, onEdit, onDelete, onToggleComplete }: TaskItemProps) {
  const containerStyle = task.currentUserCompleted 
    ? "bg-transparent border-white/5 opacity-60" 
    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20";

  return (
    <div className={`flex items-start justify-between p-4 border rounded-xl transition-all gap-3 ${containerStyle}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <Button onClick={() => onToggleComplete(task)} className="shrink-0 transition-colors hover:scale-110" title={task.currentUserCompleted ? "Mark incomplete" : "Mark complete"}>
            {task.currentUserCompleted ? <CheckCircle size={18} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> : <Circle size={18} className="text-white/30" />}
          </Button>
          <h3 className={`font-bold truncate text-sm ${task.currentUserCompleted ? "text-white/40 line-through" : "text-white"}`}>{task.title}</h3>
        </div>
        
        {task.description && <p className="text-xs text-white/40 mt-0.5 line-clamp-1 ml-8">{task.description}</p>}
        
        <TaskMetadata task={task} />
        
        <div className="flex items-center gap-2 mt-3 ml-8 pt-3 border-t lunar-divider">
          <MemberProgressBadge count={task.completedMembers.length} members={task.completedMembers} label="completed" color="green" />
          <MemberProgressBadge count={task.inProgressMembers.length} members={task.inProgressMembers} label="in progress" color="amber" />
        </div>
      </div>
      
      <div className="flex items-center gap-1 shrink-0">
        <Button onClick={() => onEdit(task)} className="p-1.5 text-white/30 hover:text-white hover:bg-white/20 rounded-lg transition-colors" title="Edit task"><Pencil size={14} /></Button>
        <Button onClick={() => onDelete(task.groupTaskGroupId)} className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors" title="Delete task"><Trash2 size={14} /></Button>
      </div>
    </div>
  );
}

/**
 * Displays a list of group tasks including member progress badges.
 * Allows any group member to mark their copy complete, or edit/delete the global task.
 *
 * @param {GroupTasksProps} props - Component props.
 * @returns {JSX.Element} The rendered list of group tasks.
 */
export default function GroupTasks({ tasksWithProgress, onEdit, onDelete, onToggleComplete }: GroupTasksProps) {
  return (
    <div className="lunar-card p-6">
      <h2 className="lunar-label mb-4 flex items-center gap-2 text-sm text-white">
        <ListTodo size={16} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" /> Group Tasks ({tasksWithProgress.length})
      </h2>
      
      {tasksWithProgress.length > 0 ? (
        <div className="max-h-80 overflow-y-auto space-y-2 pr-1 lunar-scroll">
          {tasksWithProgress.map((task) => (
            <TaskItem 
              key={task.groupTaskGroupId} 
              task={task} 
              onEdit={onEdit} 
              onDelete={onDelete} 
              onToggleComplete={onToggleComplete} 
            />
          ))}
        </div>
      ) : (
        <p className="lunar-value text-center py-8">No tasks yet. Create one using the button above!</p>
      )}
    </div>
  );
}