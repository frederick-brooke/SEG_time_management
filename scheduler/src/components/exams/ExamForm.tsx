"use client";

import React, { useState } from "react";
import { createExam, updateExamSettings } from "@/src/app/actions/examActions";
import { createNotification } from "@/src/app/actions/notifications";
import { NotificationType } from "@prisma/client";
import { useSession } from "next-auth/react";

const { data: session } = useSession();

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
    const [serverError, setServerError] = useState("");
    const [isPending, setIsPending] = useState(false);
    const formLabelStyle = "block text-[12px] font-black uppercase tracking-widest text-white/40 ml-1";
    const inputStyle = "w-full bg-white/10 border-white/10 text-white placeholder:text-white/20 focus:ring-2 focus:ring-blue-500/40 rounded-xl transition-all outline-none text-base font-medium shadow-inner [color-scheme:dark]";
    const saveStyle = "bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl px-2 py-2 uppercase tracking-widest shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400/50 transition-all";
    
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
                await createNotification(
                    session?.user?.id,
                    editingExam ? "Exam Updated" : "Exam Added",
                    editingExam
                        ? `"${formData.get("title")}" has been updated.`
                        : `"${formData.get("title")} has been added to your planner.`,
                    editingExam ? NotificationType.INFO : NotificationType.SUCCESS
                );
              
            } else {
                setServerError(result.error || "Failed to save exam details");
            }
        } catch (error) {
            setServerError("A network error occured. Please try again.");
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
                <label className={formLabelStyle}>Exam Title</label>
                <input 
                    name="title" 
                    defaultValue={editingExam?.title || ""}
                    required
                    className={inputStyle}  
                />
            </div>
            <div>
                <label className={formLabelStyle}>Exam Date</label>
                <input 
                    name="examDate" 
                    type="date" 
                    defaultValue={editingExam ? new Date(editingExam.examDate).toISOString().split('T')[0] : ""}
                    required 
                    className={inputStyle} 
                />                        
            </div>
            <div>
                <label className={formLabelStyle}>Daily Study Goal (mins)</label>
                <input 
                    name="maxTimePerDay" 
                    type="number" 
                    defaultValue={editingExam?.maxTimePerDay || ""}
                    required 
                    className={inputStyle}
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
                    className={saveStyle}
                >
                    {isPending? "Saving..." : editingExam ? "Update Settings" : "Save Exam"}
                </button>            
            </div>
        </form>
    );
}