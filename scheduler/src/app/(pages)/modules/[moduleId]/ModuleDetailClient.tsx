'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createModuleTask, updateModuleTask, deleteModuleTask, deleteModuleEvent } from "@/app/actions/module";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";

//components
import ModuleHeader from "components/modules/ModuleHeader";
import ModuleMembersList from "components/modules/ModuleMembersList";
import ModuleEvents from "components/modules/ModuleEvents";
import ModuleTasks from "components/modules/ModuleTasks";
import { TaskForm } from "@/src/components/tasks/TaskForm";
import ModuleEventModal from "components/modules/ModuleEventModal";
import ModuleSettingsModal from "components/modules/ModuleSettingsModal";

//constants
const EMPTY_TASK_FORM = {
  name: "", description: "", dueDate: "", url: "", subtasks: "",
  durationHours: "0", durationMinutes: "0", priority: "Low", examId: "none",
  bufferDays: 0, isRecurring: false, recurrence: null,
};

//main component

/**
 * Client-side container for the Module Detail page.
 * Manages all modal state and handles create, update, delete operations for tasks and events.
 * @param {object} props - Module, events, tasks, and task progress data.
 * @return {JSX.Element} The assembled module detail view.
 */
export default function ModuleDetailClient({ module, events, tasks, tasksWithProgress }: any) {
  const router = useRouter();
  const isOwner = module.userRole === 'OWNER';
  const isOwnerOrAdmin = isOwner || module.userRole === 'ADMIN';

  const [showEventForm, setShowEventForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [taskFormData, setTaskFormData] = useState<any>(EMPTY_TASK_FORM);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  /**
   * Submits the task form to create or update a module-wide task.
   * @return {Promise<void>}
   */
  const handleSubmitTask = async () => {
    if (!taskFormData.name.trim()) { alert("Task name is required"); return; }
    const hours = parseInt(taskFormData.durationHours) || 0;
    const mins = parseInt(taskFormData.durationMinutes) || 0;
    const subtasksArray = taskFormData.subtasks
      ? taskFormData.subtasks.split(",").map((s: string) => s.trim()).filter(Boolean)
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
      alert("error" in result ? result.error : "Failed to save task");
    }
  };

  /**
   * Pre-populates the task form and opens the modal for editing an existing task.
   * @param {any} task - The existing task data to load.
   * @return {void}
   */
  const openEditTask = (task: any) => {
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
      bufferDays: 0,
      isRecurring: false,
      recurrence: null,
    });
    setEditingTask(task);
    setShowTaskForm(true);
  };

  /**
   * Confirms and deletes all member copies of a shared task.
   * @param {string} groupId - The shared task group ID to delete.
   * @return {Promise<void>}
   */
  const handleDeleteTask = async (groupId: string) => {
    if (!confirm('Delete this task for all members?')) return;
    const result = await deleteModuleTask(groupId, module.id);
    if (result.success) router.refresh();
  };

  /**
   * Confirms and deletes all member copies of a shared event.
   * @param {string} groupId - The shared event group ID to delete.
   * @return {Promise<void>}
   */
  const handleDeleteEvent = async (groupId: string) => {
    if (!confirm('Delete this event for all members?')) return;
    const result = await deleteModuleEvent(groupId, module.id);
    if (result.success) router.refresh();
  };

  return (
    <LunarThemeWrapper>
      <div className="lunar-page">

        <Link href="/modules" className="lunar-label hover:text-white transition-colors mb-2 inline-block">
          ← Back to Modules
        </Link>

        <ModuleHeader
          module={module} isOwner={isOwner} isOwnerOrAdmin={isOwnerOrAdmin}
          onOpenTaskModal={() => { setEditingTask(null); setTaskFormData(EMPTY_TASK_FORM); setShowTaskForm(true); }}
          onOpenEventModal={() => { setEditingEvent(null); setShowEventForm(true); }}
          onOpenSettings={() => setShowSettings(true)}
        />

        <ModuleMembersList members={module.members} isOwner={isOwner} moduleId={module.id} currentUserRole={module.userRole} />

        <ModuleEvents
          events={events} isOwner={isOwner}
          onEdit={(event: any) => { setEditingEvent(event); setShowEventForm(true); }}
          onDelete={handleDeleteEvent}
        />

        <ModuleTasks
          tasks={tasks} tasksWithProgress={tasksWithProgress} isOwnerOrAdmin={isOwnerOrAdmin}
          onEdit={openEditTask} onDelete={handleDeleteTask}
        />

      </div>

      {showEventForm && (
        <ModuleEventModal moduleId={module.id} editingEvent={editingEvent}
          onClose={() => { setShowEventForm(false); setEditingEvent(null); }}
          onSuccess={() => router.refresh()} />
      )}

      {showTaskForm && (
        <TaskForm isOpen={showTaskForm}
          onOpenChange={(open: boolean) => { setShowTaskForm(open); if (!open) setEditingTask(null); }}
          editingTaskId={editingTask?.moduleTaskGroupId ?? null}
          formData={taskFormData}
          onFormChange={(updates: any) => setTaskFormData((prev: any) => ({ ...prev, ...updates }))}
          onSubmit={handleSubmitTask} exams={[]} />
      )}

      {showSettings && (
        <ModuleSettingsModal module={module}
          onClose={() => setShowSettings(false)}
          onSuccess={() => router.refresh()} />
      )}
    </LunarThemeWrapper>
  );
}