"use client";

import React, { useState } from "react";
import { createExam } from "@/src/app/actions/examActions";

export default function ExamFormDialog({ onExamAdded }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const result = await createExam(formData);

        if (result.success) {
            onExamAdded(result.exam);
            setIsOpen(false);
            e.target.reset();
        } else {
            alert(result.error || "Failed to create exam");
        }
    };

    return (
        <div>
            <button
                onClick={() => setIsOpen(true)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 transition font-medium"
            >
                + Add Exam
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6">Setup New Exam</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold mb-1">Exam Title</label>
                                <input name="title" required className="w-full border-2 p-3 rounded-xl focus:border-indigo-500 outline none" placeholder="e.g. Computer Science" />                        
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Exam Dare</label>
                                <input name="examDate" type="date" required className="w-full border-2 p-3 rounded-xl focus:border-indigo-500 outline none"/>                        
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Daily Study Goal (mins)</label>
                                <input name="maxTimePerDay" type="number" required className="w-full border-2 p-3 rounded-xl focus:border-indigo-500 outline none" placeholder="e.g. 120" />                        
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
                                <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition">Save Exam</button>            
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}