"use client";

import React, { useState } from "react";
import { createExam, updateExamSettings } from "@/src/app/actions/examActions";

export default function ExamFormDialog({ onExamAdde, onExamUpdated, editingExam }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
       
        if (editingExam) {
            const result = await updateExamSettings(editingExam.id, {
                title: formData.get("title"),
                examDate: new Date(formData.get("examDate")),
                maxTimePerDay: parseInt(formData.get("maxTimePerDay"))
            });
            if (onExamUpdated) onExamUpdated(result);
            setIsOpen(false);
        } else {
            const result = await createExam(formData);
            if (result.success) {
                if (onExamAdded) onExamAdded(result.exam);
                setIsOpen(false);
                e.target.reset();
            }
        }
    };

    return (
        <div>
            <button
                onClick={() => setIsOpen(true)}
                className={editingExam
                    ? "text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded"
                    : "rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 transition font-medium"}
            >
                {editingExam ? "Edit Details" : "+ Add Exam"} {/* Dynamic label */}
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6">Setup New Exam</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
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
                                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
                                <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition">
                                    {editingExam ? "Update Settings" : "Save Exam"}
                                </button>            
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}