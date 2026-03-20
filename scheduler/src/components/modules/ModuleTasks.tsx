'use client';

import { useState } from "react";
import { ListTodo, CheckCircle, Circle, Pencil, Trash2 } from "lucide-react";
import { formatDuration, formatTaskDate } from "@/lib/format";
import type { MemberUser } from "./ModuleMembersList"; // Re-using the type we made earlier

// Types
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

const PRIORITY_STYLES: Record<string, string> = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Low: 'bg-gray-100 text-gray-700',
};

// --- Subcomponents ---

function MemberProgressBadge({ count, members, label, color }: { count: number; members: MemberUser[]; label: string; color: 'green' | 'amber' }) {
  const [open, setOpen] = useState(false);
  const styles = color === 'green' 
    ? { badge: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200', dot: 'bg-green-500' }
    : { badge: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200', dot: 'bg-amber-500' };

  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen((v) => !v)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-colors ${styles.badge}`}>
        <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
        {count} {label}
      </button>

      {open && members.length > 0 && (
        <div className="absolute bottom-full mb-2 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-3 min-w-[160px] animate-in fade-in slide-in-from-bottom-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">{label}</p>
          <ul className="space-y-1">
            {members.map((m) => (
              <li key={m.id} className="text-xs text-gray-700 font-medium">
                {m.fname || m.username} {m.lname || ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MemberTaskRow({ task }: { task: ModuleTask }) {
  return (
    <div className={`flex items-center p-4 border rounded-lg transition-all ${task.completed ? 'bg-gray-50 border-gray-200' : 'bg-gradient-to-r from-purple-50 to-white border-purple-100'}`}>
      <div className="flex items-center gap-3 flex-1">
        {task.completed ? <CheckCircle size={20} className="text-green-600 shrink-0" data-testid="completed-icon" /> : <Circle size={20} className="text-gray-300 shrink-0" data-testid="incomplete-icon" />}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold truncate ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{task.title}</h3>
          {task.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {task.dueDate && <span className="text-xs text-gray-500">📅 Due: {formatTaskDate(task.dueDate)}</span>}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.Low}`}>{task.priority}</span>
            {task.duration > 0 && <span className="text-xs text-gray-500">⏱️ {formatDuration(task.duration)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function OwnerTaskRow({ task, onEdit, onDelete }: { task: TaskWithProgress; onEdit: () => void; onDelete: () => void; }) {
  return (
    <div className="flex items-start justify-between p-4 bg-gradient-to-r from-purple-50 to-white border border-purple-100 rounded-lg gap-3">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{task.title}</h3>
        {task.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {task.dueDate && <span className="text-xs text-gray-500">📅 Due: {formatTaskDate(task.dueDate)}</span>}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.Low}`}>{task.priority}</span>
          {task.duration > 0 && <span className="text-xs text-gray-500">⏱️ {formatDuration(task.duration)}</span>}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <MemberProgressBadge count={task.completedMembers.length} members={task.completedMembers} label="completed" color="green" />
          <MemberProgressBadge count={task.inProgressMembers.length} members={task.inProgressMembers} label="in progress" color="amber" />
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" data-testid="edit-task-btn"><Pencil size={14} /></button>
        <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" data-testid="delete-task-btn"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}

// --- Main Component ---

interface ModuleTasksProps {
  tasks: ModuleTask[];
  tasksWithProgress: TaskWithProgress[];
  isOwnerOrAdmin: boolean;
  onEdit: (task: TaskWithProgress) => void;
  onDelete: (groupId: string) => void;
}

export default function ModuleTasks({ tasks, tasksWithProgress, isOwnerOrAdmin, onEdit, onDelete }: ModuleTasksProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <ListTodo size={20} className="text-purple-600" />
        {isOwnerOrAdmin ? "Assigned Tasks" : "My Tasks"}
        {" "} ({isOwnerOrAdmin ? tasksWithProgress.length : tasks.length})
      </h2>

      {isOwnerOrAdmin ? (
        tasksWithProgress.length > 0 ? (
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {tasksWithProgress.map((task) => (
              <OwnerTaskRow key={task.moduleTaskGroupId} task={task} onEdit={() => onEdit(task)} onDelete={() => onDelete(task.moduleTaskGroupId)} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No tasks assigned yet. Create one using the button above!</p>
        )
      ) : (
        tasks.length > 0 ? (
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {tasks.map((task) => (
              <MemberTaskRow key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No tasks assigned to you yet.</p>
        )
      )}
    </div>
  );
}