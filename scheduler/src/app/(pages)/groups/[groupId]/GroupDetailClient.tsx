'use client';

import {
  Users, Crown, LogOut, Calendar, ListTodo,
  Pencil, Trash2, ChevronDown, ChevronUp, Trash,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  leaveGroup, deleteGroup,
  createGroupTask, updateGroupTask, deleteGroupTask,
  deleteGroupEvent, toggleGroupTaskComplete,
} from "@/app/actions/groups";
import { TaskFormDialog } from "components/tasks/TaskFormDialog";
import GroupEventModal from "components/groups/GroupEventModal";
import { formatDuration, formatTaskDate, formatEventDate } from "@/lib/format";

//types
interface MemberUser {
  id: string;
  username: string;
  fname: string | null;
  lname: string | null;
  pfp: string | null;
}

interface Member {
  id: string;
  role: string;
  user: MemberUser;
}

interface GroupEvent {
  id: string;
  groupEventGroupId: string | null;
  title: string;
  description: string | null;
  start: Date;
  end: Date;
  category: string;
}

interface TaskWithProgress {
  groupTaskGroupId: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  priority: string;
  duration: number;
  url: string | null;
  currentUserCompleted: boolean;
  completedMembers: MemberUser[];
  inProgressMembers: MemberUser[];
  totalAssigned: number;
}

interface GroupData {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  userRole: string;
  creator: { username: string };
  members: Member[];
}

interface GroupDetailClientProps {
  group: GroupData;
  events: GroupEvent[];
  tasksWithProgress: TaskWithProgress[];
}

//constants
const EMPTY_TASK_FORM = {
  name: "", description: "", dueDate: "", url: "",
  subtasks: "", durationHours: "0", durationMinutes: "0",
  priority: "Low", examId: "none",
};

const PRIORITY_STYLES: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-gray-100 text-gray-700",
};

//subcomponents
/**
 * Displays an Owner badge for group owners
 * @param {{ role: string }} props - Member role string
 * @return {JSX.Element | null} - Owner badge or null for regular members
 */
function RoleBadge({ role }: { role: string }) {
  if (role !== "OWNER") return null;
  return (
    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200 font-semibold">
      <Crown size={12} /> Owner
    </span>
  );
}

/**
 * Clickable badge showing member names in a popover
 * @param {{ count: number; members: MemberUser[]; label: string; color: "green" | "amber" }} props
 * @return {JSX.Element} - Badge with member name popover
 */
function MemberProgressBadge({
  count, members, label, color,
}: {
  count: number;
  members: MemberUser[];
  label: string;
  color: "green" | "amber";
}) {
  const [open, setOpen] = useState(false);

  const colorMap = {
    green: { badge: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200", dot: "bg-green-500" },
    amber: { badge: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200", dot: "bg-amber-500" },
  };

  const styles = colorMap[color];

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-colors ${styles.badge}`}
      >
        <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
        {count} {label}
      </button>
      {open && members.length > 0 && (
        <div className="absolute bottom-full mb-2 left-0 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-3 min-w-[160px]">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">{label}</p>
          <ul className="space-y-1">
            {members.map((m) => (
              <li key={m.id} className="text-xs text-gray-700 font-medium">
                {m.fname || m.username} {m.lname}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Renders a single event row with edit and delete controls for all members
 * @param {{ event: GroupEvent; onEdit: () => void; onDelete: () => void }} props
 * @return {JSX.Element} - Event row card
 */
function EventRow({
  event, onEdit, onDelete,
}: {
  event: GroupEvent;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start justify-between p-4 bg-gradient-to-r from-purple-50 to-white border border-purple-100 rounded-lg gap-3">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
        {event.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="text-xs text-gray-500">📅 {formatEventDate(event.start)}</span>
          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
            {event.category}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onEdit}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Edit event">
          <Pencil size={14} />
        </button>
        <button onClick={onDelete}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete event">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

/**
 * Renders a group task row with progress badges, completion toggle, and edit/delete controls
 * All members can see progress, edit, delete, and mark their own copy complete
 * @param {{ task: TaskWithProgress; onEdit: () => void; onDelete: () => void; onToggleComplete: () => void }} props
 * @return {JSX.Element} - Group task row
 */
function TaskRow({
  task, onEdit, onDelete, onToggleComplete,
}: {
  task: TaskWithProgress;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: () => void;
}) {
  return (
    <div className={`flex items-start justify-between p-4 border rounded-lg gap-3 transition-all ${
      task.currentUserCompleted
        ? "bg-gray-50 border-gray-200"
        : "bg-gradient-to-r from-purple-50 to-white border-purple-100"
    }`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Completion toggle for current user's copy */}
          <button
            onClick={onToggleComplete}
            className="shrink-0 p-0.5 rounded transition-colors hover:opacity-80"
            title={task.currentUserCompleted ? "Mark incomplete" : "Mark complete"}
          >
            {task.currentUserCompleted
              ? <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
            }
          </button>
          <h3 className={`font-semibold truncate ${task.currentUserCompleted ? "text-gray-400 line-through" : "text-gray-900"}`}>
            {task.title}
          </h3>
        </div>
        {task.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-1 ml-7">{task.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 flex-wrap ml-7">
          {task.dueDate && (
            <span className="text-xs text-gray-500">📅 Due: {formatTaskDate(task.dueDate)}</span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.Low}`}>
            {task.priority}
          </span>
          {task.duration > 0 && (
            <span className="text-xs text-gray-500">⏱️ {formatDuration(task.duration)}</span>
          )}
        </div>
        {/* Progress badges */}
        <div className="flex items-center gap-2 mt-3 ml-7">
          <MemberProgressBadge
            count={task.completedMembers.length}
            members={task.completedMembers}
            label="completed"
            color="green"
          />
          <MemberProgressBadge
            count={task.inProgressMembers.length}
            members={task.inProgressMembers}
            label="in progress"
            color="amber"
          />
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onEdit}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Edit task">
          <Pencil size={14} />
        </button>
        <button onClick={onDelete}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete task">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

//main component
/**
 * Client component for the group detail page
 * All members can create, edit, delete events and tasks, and complete their own tasks
 * @param {GroupDetailClientProps} props - Group, events, and tasks with progress data
 * @return {JSX.Element} - Full group detail view
 */
export default function GroupDetailClient({
  group, events, tasksWithProgress,
}: GroupDetailClientProps) {
  const router = useRouter();
  const isOwner = group.userRole === "OWNER";

  const [showMembers, setShowMembers] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFormData, setTaskFormData] = useState(EMPTY_TASK_FORM);
  const [editingTask, setEditingTask] = useState<TaskWithProgress | null>(null);
  const [editingEvent, setEditingEvent] = useState<GroupEvent | null>(null);

  /**
   * Confirms and leaves the group — non-owners only
   * @return {Promise<void>}
   */
  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    const result = await leaveGroup(group.id);
    if (result.success) {
      router.push("/groups");
    } else {
      alert(result.error || "Failed to leave group");
    }
  };

  /**
   * Confirms and permanently deletes the group — owner only
   * @return {Promise<void>}
   */
  const handleDeleteGroup = async () => {
    if (!confirm("Permanently delete this group? This cannot be undone.")) return;
    const result = await deleteGroup(group.id);
    if (result.success) {
      router.push("/groups");
    } else {
      alert(result.error || "Failed to delete group");
    }
  };

  /**
   * Submits the task form to create or update a group-wide task
   * @return {Promise<void>}
   */
  const handleSubmitTask = async () => {
    if (!taskFormData.name.trim()) {
      alert("Task name is required");
      return;
    }

    const hours = parseInt(taskFormData.durationHours) || 0;
    const mins = parseInt(taskFormData.durationMinutes) || 0;
    const subtasksArray = taskFormData.subtasks
      ? taskFormData.subtasks.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const payload = {
      title: taskFormData.name,
      description: taskFormData.description,
      dueDate: taskFormData.dueDate || null,
      priority: taskFormData.priority,
      duration: hours * 60 + mins,
      subtasks: subtasksArray,
      url: taskFormData.url || null,
    };

    const result = editingTask
      ? await updateGroupTask(editingTask.groupTaskGroupId, group.id, payload)
      : await createGroupTask(group.id, payload);

    if (result.success) {
      setTaskFormData(EMPTY_TASK_FORM);
      setEditingTask(null);
      setShowTaskForm(false);
      router.refresh();
    } else {
      alert(result.error || "Failed to save task");
    }
  };

  /**
   * Opens the task form pre-populated with an existing task's data
   * @param {TaskWithProgress} task - The task to edit
   * @return {void}
   */
  const openEditTask = (task: TaskWithProgress) => {
    setTaskFormData({
      name: task.title,
      description: task.description || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      url: task.url || "",
      subtasks: "",
      durationHours: String(Math.floor(task.duration / 60)),
      durationMinutes: String(task.duration % 60),
      priority: task.priority,
      examId: "none",
    });
    setEditingTask(task);
    setShowTaskForm(true);
  };

  /**
   * Confirms and deletes all member copies of a group task
   * @param {string} groupTaskGroupId - The task group ID to delete
   * @return {Promise<void>}
   */
  const handleDeleteTask = async (groupTaskGroupId: string) => {
    if (!confirm("Delete this task for all members?")) return;
    const result = await deleteGroupTask(groupTaskGroupId, group.id);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || "Failed to delete task");
    }
  };

  /**
   * Confirms and deletes all member copies of a group event
   * @param {string} groupEventGroupId - The event group ID to delete
   * @return {Promise<void>}
   */
  const handleDeleteEvent = async (groupEventGroupId: string) => {
    if (!confirm("Delete this event for all members?")) return;
    const result = await deleteGroupEvent(groupEventGroupId, group.id);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || "Failed to delete event");
    }
  };

  /**
   * Toggles the current user's completion state for a group task
   * @param {TaskWithProgress} task - The task to toggle
   * @return {Promise<void>}
   */
  const handleToggleComplete = async (task: TaskWithProgress) => {
    const result = await toggleGroupTaskComplete(
      task.groupTaskGroupId,
      group.id,
      !task.currentUserCompleted
    );
    if (result.success) {
      router.refresh();
    } else {
      alert("error" in result ? result.error : "Failed to update task");
    }
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        <div className="max-w-5xl w-full mx-auto py-8">

          <Link href="/groups" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
            ← Back to Groups
          </Link>

          {/* ── Group header ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4">
                <div className="bg-purple-50 p-4 rounded-xl shrink-0">
                  <Users className="text-purple-600" size={32} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
                  {group.description && (
                    <p className="text-gray-600 mt-2">{group.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Users size={16} /> {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
                    </span>
                    <span>Created by @{group.creator.username}</span>
                  </div>
                </div>
              </div>

              {/* Actions — all members can create events and tasks */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => { setEditingTask(null); setTaskFormData(EMPTY_TASK_FORM); setShowTaskForm(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg border border-purple-200 font-medium hover:bg-purple-100 transition-colors"
                >
                  <ListTodo size={16} /> Create Task
                </button>
                <button
                  onClick={() => { setEditingEvent(null); setShowEventForm(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg border border-green-200 font-medium hover:bg-green-100 transition-colors"
                >
                  <Calendar size={16} /> Create Event
                </button>
                {isOwner ? (
                  <button
                    onClick={handleDeleteGroup}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg border border-red-200 font-medium hover:bg-red-100 transition-colors"
                  >
                    <Trash size={16} /> Delete Group
                  </button>
                ) : (
                  <button
                    onClick={handleLeave}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg border border-red-200 font-medium hover:bg-red-100 transition-colors"
                  >
                    <LogOut size={16} /> Leave Group
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Members list — toggleable ── */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
            <button
              onClick={() => setShowMembers((v) => !v)}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users size={20} /> Members ({group.members.length})
              </h2>
              {showMembers
                ? <ChevronUp size={20} className="text-gray-400" />
                : <ChevronDown size={20} className="text-gray-400" />
              }
            </button>
            {showMembers && (
              <div className="px-6 pb-6">
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {group.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <Link href={`/profile/${member.user.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden shrink-0">
                          {member.user.pfp ? (
                            <img src={member.user.pfp} alt={member.user.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold">
                              {member.user.fname?.[0] || member.user.username[0]}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {member.user.fname || member.user.username} {member.user.lname}
                          </p>
                          <p className="text-xs text-gray-500">@{member.user.username}</p>
                        </div>
                      </Link>
                      <RoleBadge role={member.role} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Events list ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-green-600" /> Group Events ({events.length})
            </h2>
            {events.length > 0 ? (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {events.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    onEdit={() => { setEditingEvent(event); setShowEventForm(true); }}
                    onDelete={() => event.groupEventGroupId && handleDeleteEvent(event.groupEventGroupId)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No events yet. Create one using the button above!
              </p>
            )}
          </div>

          {/* ── Tasks list ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ListTodo size={20} className="text-purple-600" /> Group Tasks ({tasksWithProgress.length})
            </h2>
            {tasksWithProgress.length > 0 ? (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {tasksWithProgress.map((task) => (
                  <TaskRow
                    key={task.groupTaskGroupId}
                    task={task}
                    onEdit={() => openEditTask(task)}
                    onDelete={() => handleDeleteTask(task.groupTaskGroupId)}
                    onToggleComplete={() => handleToggleComplete(task)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No tasks yet. Create one using the button above!
              </p>
            )}
          </div>

        </div>
      </div>

      {/* ── Modals ── */}
      {showEventForm && (
        <GroupEventModal
          groupId={group.id}
          editingEvent={editingEvent}
          onClose={() => { setShowEventForm(false); setEditingEvent(null); }}
          onSuccess={() => router.refresh()}
        />
      )}

      {showTaskForm && (
        <TaskFormDialog
          isOpen={showTaskForm}
          onOpenChange={(open) => { setShowTaskForm(open); if (!open) setEditingTask(null); }}
          editingTaskId={editingTask?.groupTaskGroupId ?? null}
          formData={taskFormData}
          onFormChange={(updates) => setTaskFormData((prev) => ({ ...prev, ...updates }))}
          onSubmit={handleSubmitTask}
          exams={[]}
        />
      )}
    </>
  );
}
