'use client';

import { useState } from "react";
import { createModuleTask } from "@/src/app/actions/module";
import { TaskFormDialog } from "@/src/components/tasks/TaskFormDialog";

interface ModuleTaskFormProps {
  moduleId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Wrapper for task form dialog to create module tasks
 * @param {ModuleTaskFormProps} props - Module ID and dialog controls
 * @return {JSX.Element} - Task form dialog
 */
export default function ModuleTaskForm({ 
  moduleId, 
  isOpen, 
  onOpenChange, 
  onSuccess 
}: ModuleTaskFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dueDate: "",
    url: "",
    subtasks: "",
    durationHours: "0",
    durationMinutes: "0",
    priority: "Low",
    examId: "none"
  });

  /**
   * Handles form field changes
   */
  const handleFormChange = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert("Task name is required");
      return;
    }

    // Convert duration to minutes
    const hours = parseInt(formData.durationHours) || 0;
    const minutes = parseInt(formData.durationMinutes) || 0;
    const totalDuration = (hours * 60) + minutes;

    // Convert subtasks string to array
    const subtasksArray = formData.subtasks
      ? formData.subtasks.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const result = await createModuleTask(moduleId, {
      title: formData.name,
      description: formData.description,
      dueDate: formData.dueDate || null,
      priority: formData.priority,
      duration: totalDuration,
      durationHours: formData.durationHours,
      durationMins: formData.durationMinutes,
      subtasks: subtasksArray,
      url: formData.url || null
    });

    if (result.success) {
      // Reset form
      setFormData({
        name: "",
        description: "",
        dueDate: "",
        url: "",
        subtasks: "",
        durationHours: "0",
        durationMinutes: "0",
        priority: "Low",
        examId: "none"
      });
      
      onSuccess();
      onOpenChange(false);
    } else {
      alert(result.error || "Failed to create task");
    }
  };

  return (
    <TaskFormDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      editingTaskId={null}
      formData={formData}
      onFormChange={handleFormChange}
      onSubmit={handleSubmit}
      exams={[]} // Module tasks don't link to exams
    />
  );
}