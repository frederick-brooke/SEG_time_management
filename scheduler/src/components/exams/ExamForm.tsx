"use client";

import React, { useState } from "react";
import { createExam, updateExamSettings } from "@/app/actions/examActions";
import { createNotification } from "@/app/actions/notifications";
import { NotificationType } from "@prisma/client";
import { useSession } from "next-auth/react";


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
     * Handles the asynchronous submission of the exam data.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError("");
        setIsPending(true);

        const formData = new FormData(e.target);
        let result;
       
        try {
            if (editingExam) {
                result = await updateExamSettings(editingExam.id, {
                    title: formData.get("title") as string,
                    examDate: new Date(formData.get("examDate") as string),
                    maxTimePerDay: parseInt(formData.get("maxTimePerDay") as string)
                });
            } else {
                result = await createExam(formData);
            }
            if (result.success) {
                if (session?.user?.id) {
                    await createNotification(
                        session?.user?.id,
                        editingExam ? "Exam Updated" : "Exam Added",
                        editingExam
                            ? `"${formData.get("title")}" has been updated.`
                            : `"${formData.get("title")} has been added to your planner.`,
                        editingExam ? NotificationType.INFO : NotificationType.SUCCESS
                    );
                }

                if (editingExam) {
                    onExamUpdated?.(result.data);
                } else {
                    onExamAdded?.(result.data);
                }

                onSuccess();
              
            } else {
                setServerError(result.error || "Failed to save exam details");
            }
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
                <button 
                    type="button" 
                    onClick={onSuccess} 
                    className="text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    className="lunar-button-primary"
                >
                    {isPending? "Saving..." : editingExam ? "Update Settings" : "Save Exam"}
                </button>            
            </div>
        </form>
    );
}