/**
 * Group detail client page.
 * Manages group tasks, events, and settings with full CRUD actions and modal-based UI.
 * Handles client-side state and communicates with server actions to update group data.
 */

'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  createGroupTask, 
  updateGroupTask, 
  deleteGroupTask, 
  deleteGroupEvent, 
  toggleGroupTaskComplete 
} from "@/app/actions/groups";

// Subcomponents
import GroupHeader from "components/groups/GroupHeader";
import GroupMembersList from "components/groups/GroupMembersList";
import GroupEvents from "components/groups/GroupEvents";
import GroupTasks from "components/groups/GroupTasks";
import { TaskForm } from "@/components/tasks/TaskForm";
import GroupEventModal from "components/groups/GroupEventModal";
import GroupSettingsModal from "components/groups/GroupSettingsModal";

const EMPTY_TASK_FORM = {
  name: "", description: "", dueDate: "", url: "",
  subtasks: "", durationHours: "0", durationMinutes: "0",
  priority: "Low", examId: "none", bufferDays: 0, isRecurring: false, recurrence: "none",
};

/**
 * Client-side container component for the Group Detail page.
 * Manages state for modals (events, tasks, settings) and handles all API interactions
 * for updating, deleting, and completing shared group items.
 *
 * @param {object} props - The component props.
 * @param {any} props.group - The detailed group data including members and user role.
 * @param {any[]} props.events - List of upcoming group events.
 * @param {any[]} props.tasksWithProgress - List of group tasks with aggregated completion statuses.
 * @return {JSX.Element} The assembled group detail view.
 */
export default function GroupDetailClient({ group, events, tasksWithProgress }: any) {
  const router = useRouter();

  const isOwner = group.userRole === "OWNER";

  // Modal States
  const [showSettings, setShowSettings] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  
  // Form Data States
  const [taskFormData, setTaskFormData] = useState<any>(EMPTY_TASK_FORM);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);


  // Task handlers

  /**
   * Submits the task form state to the server to create or update a group task.
   * @return {Promise<void>}
   */
  const handleSubmitTask = async () => {
    if (!taskFormData.name.trim()) return alert("Task name is required");

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
   * Pre-populates the task form state and opens the modal for editing an existing task.
   * @param {any} task - The existing task data to load.
   * @return {void}
   */
  const openEditTask = (task: any) => {
    setTaskFormData({
      name: task.title, 
      description: task.description || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      url: task.url || "", 
      subtasks: task.subtasks?.join(", ") || "",
      durationHours: String(Math.floor(task.duration / 60)),
      durationMinutes: String(task.duration % 60),
      priority: task.priority, 
      examId: "none", 
      bufferDays: 0, 
      isRecurring: false, 
      recurrence: "none"
    });
    setEditingTask(task);
    setShowTaskForm(true);
  };

  /**
   * Prompts for confirmation and deletes all member copies of a shared task.
   * @param {string} groupTaskGroupId - The shared task ID to delete.
   * @return {Promise<void>}
   */
  const handleDeleteTask = async (groupTaskGroupId: string) => {
    if (!confirm("Delete this task for all members?")) return;
    const result = await deleteGroupTask(groupTaskGroupId, group.id);
    if (result.success) router.refresh();
    else alert(result.error || "Failed to delete task");
  };

  /**
   * Toggles the completion status of a shared task specifically for the current user.
   * @param {any} task - The task to toggle.
   * @return {Promise<void>}
   */
  const handleToggleComplete = async (task: any) => {
    const result = await toggleGroupTaskComplete(task.groupTaskGroupId, group.id, !task.currentUserCompleted);
    if (result.success) router.refresh();
    else alert("error" in result ? result.error : "Failed to update task");
  };

  // Event handlers

  /**
   * Prompts for confirmation and deletes all member copies of a shared event.
   * @param {string} groupEventGroupId - The shared event ID to delete.
   * @return {Promise<void>}
   */
  const handleDeleteEvent = async (groupEventGroupId: string) => {
    if (!confirm("Delete this event for all members?")) return;
    const result = await deleteGroupEvent(groupEventGroupId, group.id);
    if (result.success) router.refresh();
    else alert(result.error || "Failed to delete event");
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        <div className="max-w-5xl w-full mx-auto py-8">
          
          <Link href="/groups" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
            ← Back to Groups
          </Link>

          <GroupHeader 
            group={group} 
            isOwner={isOwner} 
            onOpenTaskModal={() => { setEditingTask(null); setTaskFormData(EMPTY_TASK_FORM); setShowTaskForm(true); }}
            onOpenEventModal={() => { setEditingEvent(null); setShowEventForm(true); }}
            onOpenSettings={() => setShowSettings(true)}
          />

          <GroupMembersList 
            members={group.members} 
            isOwner={isOwner} 
            groupId={group.id} 
          />

          <GroupEvents 
            events={events} 
            onEdit={(event: any) => { setEditingEvent(event); setShowEventForm(true); }} 
            onDelete={handleDeleteEvent} 
          />

          <GroupTasks 
            tasksWithProgress={tasksWithProgress} 
            onEdit={openEditTask} 
            onDelete={handleDeleteTask} 
            onToggleComplete={handleToggleComplete} 
          />

        </div>
      </div>

      {/* Modals */}
      
      {showSettings && (
        <GroupSettingsModal 
          group={group} 
          onClose={() => setShowSettings(false)} 
          onSuccess={() => router.refresh()} 
        />
      )}

      {showEventForm && (
        <GroupEventModal 
          groupId={group.id} 
          editingEvent={editingEvent} 
          onClose={() => { setShowEventForm(false); setEditingEvent(null); }} 
          onSuccess={() => router.refresh()} 
        />
      )}

      {showTaskForm && (
        <TaskForm 
          isOpen={showTaskForm} 
          onOpenChange={(open: boolean) => { setShowTaskForm(open); if (!open) setEditingTask(null); }} 
          editingTaskId={editingTask?.groupTaskGroupId ?? null} 
          formData={taskFormData} 
          onFormChange={(updates: any) => setTaskFormData((prev: any) => ({ ...prev, ...updates }))} 
          onSubmit={handleSubmitTask} 
          exams={[]} 
        />
      )}
    </>
  );
}