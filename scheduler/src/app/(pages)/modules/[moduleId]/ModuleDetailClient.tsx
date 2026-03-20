'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createModuleTask, updateModuleTask, deleteModuleTask, deleteModuleEvent } from "@/app/actions/module";

// Subcomponents
import ModuleHeader from "components/modules/ModuleHeader";
import ModuleMembersList from "components/modules/ModuleMembersList";
import ModuleEvents from "components/modules/ModuleEvents";
import ModuleTasks from "components/modules/ModuleTasks";
import { TaskFormDialog } from "components/tasks/TaskFormDialog";
import ModuleEventModal from "components/modules/ModuleEventModal";

const EMPTY_TASK_FORM = {
  name: "", description: "", dueDate: "", url: "", subtasks: "", 
  durationHours: "0", durationMinutes: "0", priority: "Low", examId: "none",
  bufferDays: 0, isRecurring: false, recurrence: null,
};

export default function ModuleDetailClient({ module, events, tasks, tasksWithProgress }: any) {
  const router = useRouter();
  const isOwner = module.userRole === 'OWNER';
  const isOwnerOrAdmin = isOwner || module.userRole === 'ADMIN';

  const [showEventForm, setShowEventForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFormData, setTaskFormData] = useState<any>(EMPTY_TASK_FORM);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);

  const handleSubmitTask = async () => {
    if (!taskFormData.name.trim()) {
      alert("Task name is required");
      return;
    }

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
  const handleDeleteTask = async (groupId: string) => {
    if (!confirm('Delete this task for all members?')) return;
    const result = await deleteModuleTask(groupId, module.id);
    if (result.success) router.refresh();
  };

  const handleDeleteEvent = async (groupId: string) => {
    if (!confirm('Delete this event for all members?')) return;
    const result = await deleteModuleEvent(groupId, module.id);
    if (result.success) router.refresh();
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        <div className="max-w-5xl w-full mx-auto py-8">
          <Link href="/modules" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
            ← Back to Modules
          </Link>

          <ModuleHeader 
            module={module} isOwner={isOwner} isOwnerOrAdmin={isOwnerOrAdmin}
            onOpenTaskModal={() => { setEditingTask(null); setTaskFormData(EMPTY_TASK_FORM); setShowTaskForm(true); }}
            onOpenEventModal={() => { setEditingEvent(null); setShowEventForm(true); }}
          />

          <ModuleMembersList members={module.members} />

          <ModuleEvents 
            events={events} isOwner={isOwner} 
            onEdit={(event) => { setEditingEvent(event); setShowEventForm(true); }} 
            onDelete={handleDeleteEvent} 
          />

          <ModuleTasks 
            tasks={tasks} tasksWithProgress={tasksWithProgress} isOwnerOrAdmin={isOwnerOrAdmin}
            onEdit={openEditTask} onDelete={handleDeleteTask} 
          />
        </div>
      </div>

      {showEventForm && (
        <ModuleEventModal moduleId={module.id} editingEvent={editingEvent} onClose={() => { setShowEventForm(false); setEditingEvent(null); }} onSuccess={() => router.refresh()} />
      )}

      {showTaskForm && (
        <TaskFormDialog isOpen={showTaskForm} onOpenChange={(open) => { setShowTaskForm(open); if (!open) setEditingTask(null); }} editingTaskId={editingTask?.moduleTaskGroupId ?? null} formData={taskFormData} onFormChange={(updates) => setTaskFormData((prev: any) => ({ ...prev, ...updates }))} onSubmit={handleSubmitTask} exams={[]} />
      )}
    </>
  );
}