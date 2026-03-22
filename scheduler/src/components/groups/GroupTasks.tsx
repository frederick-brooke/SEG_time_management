'use client';

import { useState } from "react";
import { ListTodo, Pencil, Trash2 } from "lucide-react";
import { formatDuration, formatTaskDate } from "@/lib/format";

const PRIORITY_STYLES: Record<string, string> = { High: "bg-red-100 text-red-700", Medium: "bg-yellow-100 text-yellow-700", Low: "bg-gray-100 text-gray-700" };

/**
 * Clickable badge showing member names in a dropdown popover.
 * Used to display who has completed or is in-progress on a task.
 * * @param {object} props - The component props.
 * @param {number} props.count - Number of members in this state.
 * @param {any[]} props.members - Array of member objects.
 * @param {string} props.label - Badge label text (e.g., "completed").
 * @param {"green" | "amber"} props.color - Theme color for the badge.
 * @return {JSX.Element}
 */
function MemberProgressBadge({ count, members, label, color }: any) {
  const [open, setOpen] = useState(false);
  const styles = color === "green" ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" : "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200";
  const dot = color === "green" ? "bg-green-500" : "bg-amber-500";

  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen((v) => !v)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-colors ${styles}`}>
        <span className={`w-2 h-2 rounded-full ${dot}`} /> {count} {label}
      </button>
      {open && members.length > 0 && (
        <div className="absolute bottom-full mb-2 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-3 min-w-[160px]">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">{label}</p>
          <ul className="space-y-1">
            {members.map((m: any) => <li key={m.id} className="text-xs text-gray-700 font-medium">{m.fname || m.username} {m.lname}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Displays a list of group tasks including member progress badges.
 * Allows any group member to mark their copy complete, or edit/delete the global task.
 *
 * @param {object} props - The component props.
 * @param {any[]} props.tasksWithProgress - Array of tasks augmented with completion progress data.
 * @param {(task: any) => void} props.onEdit - Callback function to open the edit modal for a specific task.
 * @param {(groupId: string) => void} props.onDelete - Callback function to delete a specific task by its groupTaskGroupId.
 * @param {(task: any) => void} props.onToggleComplete - Callback function to toggle the completion status of a task for the current user.
 * @return {JSX.Element} The rendered list of group tasks.
 */
export default function GroupTasks({ tasksWithProgress, onEdit, onDelete, onToggleComplete }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <ListTodo size={20} className="text-purple-600" /> Group Tasks ({tasksWithProgress.length})
      </h2>
      {tasksWithProgress.length > 0 ? (
        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
          {tasksWithProgress.map((task: any) => (
            <div key={task.groupTaskGroupId} className={`flex items-start justify-between p-4 border rounded-lg gap-3 transition-all ${task.currentUserCompleted ? "bg-gray-50 border-gray-200" : "bg-gradient-to-r from-purple-50 to-white border-purple-100"}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <button onClick={() => onToggleComplete(task)} className="shrink-0 p-0.5 rounded transition-colors hover:opacity-80" title={task.currentUserCompleted ? "Mark incomplete" : "Mark complete"}>
                    {task.currentUserCompleted ? <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"><svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div> : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                  </button>
                  <h3 className={`font-semibold truncate ${task.currentUserCompleted ? "text-gray-400 line-through" : "text-gray-900"}`}>{task.title}</h3>
                </div>
                {task.description && <p className="text-sm text-gray-500 mt-1 line-clamp-1 ml-7">{task.description}</p>}
                <div className="flex items-center gap-3 mt-2 flex-wrap ml-7">
                  {task.dueDate && <span className="text-xs text-gray-500">📅 Due: {formatTaskDate(task.dueDate)}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.Low}`}>{task.priority}</span>
                  {task.duration > 0 && <span className="text-xs text-gray-500">⏱️ {formatDuration(task.duration)}</span>}
                </div>
                <div className="flex items-center gap-2 mt-3 ml-7">
                  <MemberProgressBadge count={task.completedMembers.length} members={task.completedMembers} label="completed" color="green" />
                  <MemberProgressBadge count={task.inProgressMembers.length} members={task.inProgressMembers} label="in progress" color="amber" />
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onEdit(task)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit task"><Pencil size={14} /></button>
                <button onClick={() => onDelete(task.groupTaskGroupId)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete task"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">No tasks yet. Create one using the button above!</p>
      )}
    </div>
  );
}