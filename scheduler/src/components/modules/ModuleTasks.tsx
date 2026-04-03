/**
 * @file ModuleTasks.tsx
 * @description Displays a scrollable list of module tasks. Renders a detailed view with 
 * progress tracking and edit/delete controls for module Owners/Admins, and a simplified 
 * read-only view displaying personal completion status for regular members.
 */

'use client';

import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { ListTodo, CheckCircle, Circle, Pencil, Trash2 } from "lucide-react";
import { formatDuration, formatTaskDate } from "@/lib/format";
import type { MemberUser } from "./ModuleMembersList";

/**
 * Represents a task assigned specifically to a member.
 */
export interface ModuleTask {
  id: string;
  moduleTaskGroupId: string | null;
  title: string;
  description: string | null;
  dueDate: Date | null;
  priority: string;
  duration: number;
  completed: boolean;
  status: string;
}

/**
 * Represents a global task including aggregate progress data.
 */
export interface TaskWithProgress {
  moduleTaskGroupId: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  priority: string;
  duration: number;
  url: string | null;
  completedMembers: MemberUser[];
  inProgressMembers: MemberUser[];
  totalAssigned: number;
}

/**
 * Props for the MemberProgressBadge component.
 */
interface MemberProgressBadgeProps {
  count: number;
  members: MemberUser[];
  label: string;
  color: 'green' | 'amber';
}

/**
 * Props for the MemberTaskRow component.
 */
interface MemberTaskRowProps {
  task: ModuleTask;
}

/**
 * Props for the OwnerTaskRow component.
 */
interface OwnerTaskRowProps {
  task: TaskWithProgress;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Props for the ModuleTasks main component.
 */
interface ModuleTasksProps {
  tasks: ModuleTask[];
  tasksWithProgress: TaskWithProgress[];
  isOwnerOrAdmin: boolean;
  onEdit: (task: TaskWithProgress) => void;
  onDelete: (groupId: string) => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  High:   'bg-red-500/10 text-red-400 border-red-500/20 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]',
  Low:    'bg-white/10 text-white/70 border-white/20 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]',
};

/**
 * Clickable badge showing member names in a popover when clicked.
 *
 * @param {MemberProgressBadgeProps} props - Component props.
 * @returns {JSX.Element} Badge with member name popover.
 */
function MemberProgressBadge({ count, members, label, color }: MemberProgressBadgeProps) {
  const [open, setOpen] = useState(false);
  
  const styles = color === 'green'
    ? { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20', dot: 'bg-emerald-500' }
    : { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20', dot: 'bg-amber-500' };

  return (
    <div className="relative inline-block">
      <Button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider transition-colors ${styles.badge}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
        {count} {label}
      </Button>
      
      {open && members.length > 0 && (
        <div className="absolute bottom-full mb-2 left-0 z-20 bg-[#111629] border border-white/20 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-3 min-w-[160px] animate-in fade-in slide-in-from-bottom-2">
          <p className="lunar-label mb-2 text-white/80">{label}</p>
          <ul className="space-y-1">
            {members.map((m) => (
              <li key={m.id} className="text-xs text-white/60 font-medium">
                {m.fname || m.username} {m.lname || ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Read-only task row shown to regular members with their own completion status.
 *
 * @param {MemberTaskRowProps} props - Component props.
 * @returns {JSX.Element} Member task row.
 */
function MemberTaskRow({ task }: MemberTaskRowProps) {
  const containerStyle = task.completed 
    ? 'bg-transparent border-white/5 opacity-60' 
    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20';

  return (
    <div className={`flex items-center p-4 border rounded-xl transition-all ${containerStyle}`}>
      <div className="flex items-center gap-3 flex-1">
        {task.completed
          ? <CheckCircle size={18} className="text-emerald-400 shrink-0 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          : <Circle size={18} className="text-white/30 shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold truncate text-sm ${task.completed ? 'text-white/40 line-through' : 'text-white'}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{task.description}</p>
          )}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {task.dueDate && (
              <span className="text-[10px] text-white/40 font-medium">📅 Due: {formatTaskDate(task.dueDate)}</span>
            )}
            <span className={`text-[9px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider ${PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.Low}`}>
              {task.priority}
            </span>
            {(task.duration ?? 0) > 0 && (
              <span className="text-[10px] text-white/40 font-medium">⏱️ {formatDuration(task.duration)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Owner task row with progress badges and edit/delete controls.
 *
 * @param {OwnerTaskRowProps} props - Component props.
 * @returns {JSX.Element} Owner task row with progress badges.
 */
function OwnerTaskRow({ task, onEdit, onDelete }: OwnerTaskRowProps) {
  return (
    <div className="flex items-start justify-between p-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all rounded-xl gap-3">
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-white truncate text-sm">{task.title}</h3>
        {task.description && (
          <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{task.description}</p>
        )}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          {task.dueDate && (
            <span className="text-[10px] text-white/40 font-medium">📅 Due: {formatTaskDate(task.dueDate)}</span>
          )}
          <span className={`text-[9px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider ${PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.Low}`}>
            {task.priority}
          </span>
          {(task.duration ?? 0) > 0 && (
            <span className="text-[10px] text-white/40 font-medium">⏱️ {formatDuration(task.duration)}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t lunar-divider">
          <MemberProgressBadge count={task.completedMembers.length} members={task.completedMembers} label="completed" color="green" />
          <MemberProgressBadge count={task.inProgressMembers.length} members={task.inProgressMembers} label="in progress" color="amber" />
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button data-testid="edit-task-btn" onClick={onEdit} className="p-1.5 text-white/30 hover:text-white hover:bg-white/20 rounded-lg transition-colors">
          <Pencil size={14} />
        </Button>
        <Button data-testid="delete-task-btn" onClick={onDelete} className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}

/**
 * Tasks section card for the module detail page.
 * Renders OwnerTaskRow for owners/admins and MemberTaskRow for regular members.
 *
 * @param {ModuleTasksProps} props - Component props.
 * @returns {JSX.Element} Tasks list card.
 */
export default function ModuleTasks({ tasks, tasksWithProgress, isOwnerOrAdmin, onEdit, onDelete }: ModuleTasksProps) {
  const renderOwnerList = () => {
    if (tasksWithProgress.length === 0) return <p className="lunar-value text-center py-8">No tasks assigned yet. Create one using the button above!</p>;
    return (
      <div className="max-h-80 overflow-y-auto space-y-2 pr-1 lunar-scroll">
        {tasksWithProgress.map((task) => (
          <OwnerTaskRow key={task.moduleTaskGroupId} task={task} onEdit={() => onEdit(task)} onDelete={() => onDelete(task.moduleTaskGroupId)} />
        ))}
      </div>
    );
  };

  const renderMemberList = () => {
    if (tasks.length === 0) return <p className="lunar-value text-center py-8">No tasks assigned to you yet.</p>;
    return (
      <div className="max-h-80 overflow-y-auto space-y-2 pr-1 lunar-scroll">
        {tasks.map((task) => (
          <MemberTaskRow key={task.id} task={task} />
        ))}
      </div>
    );
  };

  return (
    <div className="lunar-card p-6">
      <h2 className="lunar-label mb-4 flex items-center gap-2 text-sm text-white">
        <ListTodo size={16} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
        {isOwnerOrAdmin ? "Assigned Tasks" : "My Tasks"}
        {" "}({isOwnerOrAdmin ? tasksWithProgress.length : tasks.length})
      </h2>
      {isOwnerOrAdmin ? renderOwnerList() : renderMemberList()}
    </div>
  );
}