'use client';

import {
  Users, BookOpen, Crown, Shield, Copy, LogOut,
  Calendar, ListTodo, CheckCircle, Circle,
  Pencil, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  leaveModule,
  createModuleTask,
  updateModuleTask,
  deleteModuleTask,
  updateModuleEvent,
  deleteModuleEvent,
} from "@/app/actions/module";
import { TaskFormDialog } from "components/tasks/TaskFormDialog";
import ModuleEventModal from "components/modules/ModuleEventModal";
import { formatDuration, formatTaskDate, formatEventDate } from "lib/format";

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

interface ModuleEvent {
  id: string;
  moduleEventGroupId: string | null;
  title: string;
  description: string | null;
  start: Date;
  end: Date;
  category: string;
}

interface ModuleTask {
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

interface TaskWithProgress {
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

interface ModuleData {
  id: string;
  name: string;
  description: string | null;
  joinPin: string | null;
  maxMembers: number;
  memberCount: number;
  userRole: string;
  creator: { username: string };
  members: Member[];
}

interface ModuleDetailClientProps {
  module: ModuleData;
  events: ModuleEvent[];
  tasks: ModuleTask[];
  tasksWithProgress: TaskWithProgress[];
}

//constants
const EMPTY_TASK_FORM = {
  name: "", description: "", dueDate: "", url: "",
  subtasks: "", durationHours: "0", durationMinutes: "0",
  priority: "Low", examId: "none",
};

const PRIORITY_STYLES: Record<string, string> = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Low: 'bg-gray-100 text-gray-700',
};

//subcomponents
/**
 * Displays a role badge for OWNER or ADMIN members
 * @param {{ role: string }} props - Member role string
 * @return {JSX.Element | null} - Role badge or null for regular members
 */
function RoleBadge({ role }: { role: string }) {
  if (role === 'OWNER') {
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200 font-semibold">
        <Crown size={12} /> Owner
      </span>
    );
  }
  if (role === 'ADMIN') {
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 font-semibold">
        <Shield size={12} /> Admin
      </span>
    );
  }
  return null;
}

/**
 * Shows a popover list of member names when clicked
 * @param {{ count: number; members: MemberUser[]; label: string; color: string }} props
 * @return {JSX.Element} - Clickable badge that reveals member names
 */
function MemberProgressBadge({
  count, members, label, color,
}: {
  count: number;
  members: MemberUser[];
  label: string;
  color: 'green' | 'amber';
}) {
  const [open, setOpen] = useState(false);

  const colorMap = {
    green: { badge: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200', dot: 'bg-green-500' },
    amber: { badge: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200', dot: 'bg-amber-500' },
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
 * Renders a single event row with optional owner edit/delete controls
 * @param {{ event: ModuleEvent; isOwner: boolean; onEdit: () => void; onDelete: () => void }} props
 * @return {JSX.Element} - Event row card
 */
function EventRow({
  event, isOwner, onEdit, onDelete,
}: {
  event: ModuleEvent;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start justify-between p-4 bg-gradient-to-r from-green-50 to-white border border-green-100 rounded-lg gap-3">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
        {event.description && (
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <span className="text-xs text-gray-500">📅 {formatEventDate(event.start)}</span>
          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
            {event.category}
          </span>
        </div>
      </div>

      {isOwner && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit event"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete event"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Renders a member task row with completion toggle (member only)
 * @param {{ task: ModuleTask }} props - Task data
 * @return {JSX.Element} - Member task row
 */
function MemberTaskRow({ task }: { task: ModuleTask }) {
  return (
    <div className={`flex items-center p-4 border rounded-lg transition-all ${
      task.completed ? 'bg-gray-50 border-gray-200' : 'bg-gradient-to-r from-purple-50 to-white border-purple-100'
    }`}>
      <div className="flex items-center gap-3 flex-1">
        {task.completed
          ? <CheckCircle size={20} className="text-green-600 shrink-0" />
          : <Circle size={20} className="text-gray-300 shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold truncate ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
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
        </div>
      </div>
    </div>
  );
}

/**
 * Renders an owner task row with progress counts and edit/delete controls
 * @param {{ task: TaskWithProgress; onEdit: () => void; onDelete: () => void }} props
 * @return {JSX.Element} - Owner task row with progress badges
 */
function OwnerTaskRow({
  task, onEdit, onDelete,
}: {
  task: TaskWithProgress;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start justify-between p-4 bg-gradient-to-r from-purple-50 to-white border border-purple-100 rounded-lg gap-3">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{task.title}</h3>
        {task.description && (
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {task.dueDate && (
            <span className="text-xs text-gray-500">
              📅 Due: {formatTaskDate(task.dueDate)}
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.Low}`}>
            {task.priority}
          </span>
          {task.duration > 0 && (
            <span className="text-xs text-gray-500">⏱️ {formatDuration(task.duration)}</span>
          )}
        </div>

        {/* Progress badges — click to see who is in each state */}
        <div className="flex items-center gap-2 mt-3">
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
        <button
          onClick={onEdit}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Edit task"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete task"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

//main component
/**
 * Client component for the module detail page
 * Renders different views for owners/admins vs regular members
 * @param {ModuleDetailClientProps} props - Module, events, and role-appropriate task data
 * @return {JSX.Element} - Full module detail view
 */
export default function ModuleDetailClient({
  module, events, tasks, tasksWithProgress,
}: ModuleDetailClientProps) {
  const router = useRouter();
  const isOwner = module.userRole === 'OWNER';
  const isOwnerOrAdmin = isOwner || module.userRole === 'ADMIN';

  // ── UI state ──
  const [copied, setCopied] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFormData, setTaskFormData] = useState(EMPTY_TASK_FORM);
  const [editingTask, setEditingTask] = useState<TaskWithProgress | null>(null);
  const [editingEvent, setEditingEvent] = useState<ModuleEvent | null>(null);

  /**
   * Copies the module join PIN to clipboard
   * @return {void}
   */
  const copyPin = () => {
    if (!module.joinPin) return;
    navigator.clipboard.writeText(module.joinPin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Confirms and submits a leave module request
   * @return {Promise<void>}
   */
  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this module?')) return;
    const result = await leaveModule(module.id);
    if (result.success) {
      router.push('/modules');
    } else {
      alert(result.error || 'Failed to leave module');
    }
  };

  /**
   * Submits the task form to create or update a module-wide task
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
      ? taskFormData.subtasks.split(',').map((s) => s.trim()).filter(Boolean)
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
      ? await updateModuleTask(editingTask.moduleTaskGroupId, module.id, payload)
      : await createModuleTask(module.id, payload);

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
   * Opens the task form pre-populated with an existing task's data for editing
   * @param {TaskWithProgress} task - The task to edit
   * @return {void}
   */
  const openEditTask = (task: TaskWithProgress) => {
    const totalMins = task.duration;
    setTaskFormData({
      name: task.title,
      description: task.description || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
      url: task.url || "",
      subtasks: "",
      durationHours: String(Math.floor(totalMins / 60)),
      durationMinutes: String(totalMins % 60),
      priority: task.priority,
      examId: "none",
    });
    setEditingTask(task);
    setShowTaskForm(true);
  };

  /**
   * Confirms and deletes all member copies of a module task
   * @param {string} groupId - The task group ID to delete
   * @return {Promise<void>}
   */
  const handleDeleteTask = async (groupId: string) => {
    if (!confirm('Delete this task for all members?')) return;
    const result = await deleteModuleTask(groupId, module.id);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || 'Failed to delete task');
    }
  };

  /**
   * Confirms and deletes all member copies of a module event
   * @param {string} groupId - The event group ID to delete
   * @return {Promise<void>}
   */
  const handleDeleteEvent = async (groupId: string) => {
    if (!confirm('Delete this event for all members?')) return;
    const result = await deleteModuleEvent(groupId, module.id);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || 'Failed to delete event');
    }
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        <div className="max-w-5xl w-full mx-auto py-8">

          <Link href="/modules" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
            ← Back to Modules
          </Link>

          {/* ── Module header ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4">
                <div className="bg-blue-50 p-4 rounded-xl shrink-0">
                  <BookOpen className="text-blue-600" size={32} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{module.name}</h1>
                  {module.description && (
                    <p className="text-gray-600 mt-2">{module.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Users size={16} /> {module.memberCount}/{module.maxMembers} members
                    </span>
                    <span>Created by @{module.creator.username}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons — role-dependent */}
              <div className="flex gap-2 flex-wrap">
                {isOwner && (
                  <>
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
                    {module.joinPin && (
                      <button
                        onClick={copyPin}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 font-medium hover:bg-blue-100 transition-colors"
                      >
                        <Copy size={16} /> {copied ? 'Copied!' : 'Copy PIN'}
                      </button>
                    )}
                  </>
                )}
                {!isOwnerOrAdmin && (
                  <button
                    onClick={handleLeave}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg border border-red-200 font-medium hover:bg-red-100 transition-colors"
                  >
                    <LogOut size={16} /> Leave Module
                  </button>
                )}
              </div>
            </div>

            {/* PIN display — owner only */}
            {isOwner && module.joinPin && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Join PIN</p>
                <code className="text-2xl font-mono font-bold text-blue-600 tracking-wider">
                  {module.joinPin}
                </code>
                <p className="text-xs text-gray-500 mt-1">Share this PIN with participants</p>
              </div>
            )}
          </div>

          {/* ── Members list — toggleable ── */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6">
            <button
              onClick={() => setShowMembers((v) => !v)}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users size={20} /> Members ({module.members.length})
              </h2>
              {showMembers ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
            </button>

            {showMembers && (
              <div className="px-6 pb-6">
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {module.members.map((member) => (
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
              <Calendar size={20} className="text-green-600" /> Upcoming Events ({events.length})
            </h2>
            {events.length > 0 ? (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {events.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    isOwner={isOwner}
                    onEdit={() => { setEditingEvent(event); setShowEventForm(true); }}
                    onDelete={() => event.moduleEventGroupId && handleDeleteEvent(event.moduleEventGroupId)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No events scheduled yet.{isOwner && " Create one using the button above!"}
              </p>
            )}
          </div>

          {/* ── Tasks list ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ListTodo size={20} className="text-purple-600" />
              {isOwnerOrAdmin ? "Assigned Tasks" : "My Tasks"}
              {" "}({isOwnerOrAdmin ? tasksWithProgress.length : tasks.length})
            </h2>

            {isOwnerOrAdmin ? (
              // Owner/admin view — progress counts per task
              tasksWithProgress.length > 0 ? (
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {tasksWithProgress.map((task) => (
                    <OwnerTaskRow
                      key={task.moduleTaskGroupId}
                      task={task}
                      onEdit={() => openEditTask(task)}
                      onDelete={() => handleDeleteTask(task.moduleTaskGroupId)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No tasks assigned yet.{isOwner && " Create one using the button above!"}
                </p>
              )
            ) : (
              // Member view — their own task list with completion status
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

        </div>
      </div>

      {/* ── Modals ── */}
      {showEventForm && (
        <ModuleEventModal
          moduleId={module.id}
          editingEvent={editingEvent}
          onClose={() => { setShowEventForm(false); setEditingEvent(null); }}
          onSuccess={() => router.refresh()}
        />
      )}

      {showTaskForm && (
        <TaskFormDialog
          isOpen={showTaskForm}
          onOpenChange={(open) => { setShowTaskForm(open); if (!open) setEditingTask(null); }}
          editingTaskId={editingTask?.moduleTaskGroupId ?? null}
          formData={taskFormData}
          onFormChange={(updates) => setTaskFormData((prev) => ({ ...prev, ...updates }))}
          onSubmit={handleSubmitTask}
          exams={[]}
        />
      )}
    </>
  );
}
