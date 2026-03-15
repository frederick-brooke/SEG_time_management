"use client";

import React, { useState } from "react";
import { createExam, updateExamSettings } from "@/src/app/actions/examActions";


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
                if (editingExam) {
                    onExamUpdated?.(result.data);
                } else {
                    onExamAdded?.(result.data);
                }
                onSuccess?.();
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
                <label className="block text-sm font-semibold mb-1">Exam Title</label>
                <input 
                    name="title" 
                    defaultValue={editingExam?.title || ""}
                    required
                    className="w-full border-2 p-3 rounded-xl text-black"  
                />
            </div>
            <div>
                <label className="block text-sm font-semibold mb-1">Exam Date</label>
                <input 
                    name="examDate" 
                    type="date" 
                    defaultValue={editingExam ? new Date(editingExam.examDate).toISOString().split('T')[0] : ""}
                    required 
                    className="w-full border-2 p-3 rounded-xl text-black"  
                />                        
            </div>
            <div>
                <label className="block text-sm font-semibold mb-1">Daily Study Goal (mins)</label>
                <input 
                    name="maxTimePerDay" 
                    type="number" 
                    defaultValue={editingExam?.maxTimePerDay || ""}
                    required 
                    className="w-full border-2 p-3 rounded-xl text-black"
                />                        
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button 
                    type="button" 
                    onClick={onSuccess} 
                    className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition"
                >
                    {isPending? "Saving..." : editingExam ? "Update Settings" : "Save Exam"}
                </button>            
            </div>
        </form>
    );
}