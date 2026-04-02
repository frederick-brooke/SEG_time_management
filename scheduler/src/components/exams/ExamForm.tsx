/**
 * Form component for creating or updating exam settings. 
 * Orchestrates server actions, input validation, and user notifications 
 * using a flattened, highly readable control flow.
 */
"use client";

import React, { useState } from "react";
import { createExam, updateExamSettings } from "@/app/actions/examActions";
import { createNotification } from "@/app/actions/notifications";
import { NotificationType } from "@prisma/client";
import { useSession } from "next-auth/react";
import { Button } from "../ui/Button";


const formatTime = (date: Date | string | undefined) => {
    if (!date) return "09:00";
    const d = new Date(date);
    return d.toTimeString().slice(0, 5);
}
/**
 * The core form component for creating or updating exam settings.
 * @param {Object} props The component properties.
 * @param {Function} props.onExamAdded Success callback for new exam data.
 * @param {Function} props.onExamUpdated Success callback for updated exam data.
 * @param {Object} props.editingExam The exam object being edited, if any.
 * @param {Function} props.onSuccess Callback to close the parent dialog on successful submissions.
 * @returns 
 */
export default function ExamForm({ onExamAdded, onExamUpdated, editingExam, onSuccess }) {
    const { data: session } = useSession();
    const [serverError, setServerError] = useState("");
    const [isPending, setIsPending] = useState(false);

    /**
     * Sends a notification based on whether an exam was added or updated.
     */
    const dispatchNotification = async (userId: string, title: string, isUpdate: boolean) => {
        await createNotification(
            userId,
            isUpdate ? "Exam Updated" : "Exam Added",
            isUpdate ? `"${title}" has been updated.` : `"${title}" has been added.`,
            isUpdate ? NotificationType.INFO : NotificationType.SUCCESS
        );
    };

    /**
     * Handles submission with a flat control flow (Nesting Depth: 1).
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError("");
        setIsPending(true);

        const formData = new FormData(e.target);
        const title = formData.get("title") as string;
        
        try {
            const result = editingExam 
                ? await updateExamSettings(editingExam.id, {
                    title,
                    examDate: new Date(formData.get("examDate") as string),
                    maxTimePerDay: parseInt(formData.get("maxTimePerDay") as string)
                  })
                : await createExam(formData);

            if (!result.success) {
                setServerError(result.error || "Failed to save exam details");
                setIsPending(false);
                return; 
            }

            if (session?.user?.id) {
                await dispatchNotification(session.user.id, title, !!editingExam);
            }

            editingExam ? onExamUpdated?.(result.data) : onExamAdded?.(result.data);
            onSuccess();
            
        } catch (error) {
            setServerError("A network error occurred. Please try again.");
        } finally {
            setIsPending(false);
        }
    };

    return ( 
        <form onSubmit={handleSubmit} className="space-y-5">
            {serverError && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-200">
                    {serverError}
                </div>
            )}

            <div>
                <label className="lunar-label">Exam Title</label>
                <input 
                    name="title" 
                    defaultValue={editingExam?.title || ""}
                    required
                    className="lunar-input"  
                />
            </div>
            <div>
                <label className="lunar-label">Exam Date</label>
                <input 
                    name="examDate" 
                    type="date" 
                    defaultValue={editingExam ? new Date(editingExam.examDate).toISOString().split('T')[0] : ""}
                    required 
                    className="lunar-input" 
                />                        
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="lunar-label">Start Time</label>
                    <input
                        name="startTime"
                        type="time"
                        defaultValue={editingExam ? formatTime(editingExam.examDate) : "09:00"}
                        required
                        className="lunar-input"
                    />
                </div>
                <div>
                    <label className="lunar-label">End Time</label>
                    <input
                        name="endTime"
                        type="time"
                        defaultValue={editingExam ? formatTime(editingExam.examDate) : "09:00"}
                        required
                        className="lunar-input"
                    />
                </div>    
            </div>
            <div>
                <label className="lunar-label">Daily Study Goal (mins)</label>
                <input 
                    name="maxTimePerDay" 
                    type="number" 
                    defaultValue={editingExam?.maxTimePerDay || ""}
                    required 
                    className="lunar-input"
                />                        
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <Button 
                    type="button" 
                    onClick={onSuccess} 
                    disabled={isPending}
                    className="text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                >
                    Cancel
                </Button>
                <Button 
                    type="submit" 
                    disabled={isPending}
                    className="lunar-button-primary"
                >
                    {isPending? "Saving..." : editingExam ? "Update Settings" : "Save Exam"}
                </Button>            
            </div>
        </form>
    );
}