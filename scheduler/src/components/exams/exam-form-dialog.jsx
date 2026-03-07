"use client";

import React, { useState } from "react";
import ExamForm from "./ExamForm";

export default function ExamFormDialog(props) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div>
            <button
                onClick={() => setIsOpen(true)}
                className={props.editingExam
                    ? "text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded"
                    : "rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 transition font-medium"}
            >
                {props.editingExam ? "Edit Details" : "+ Add Exam"} {/* Dynamic label */}
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6">
                            {props.editingExam ? "Edit Exam" : "Setup New Exam"}    
                        </h2>
                        
                        <ExamForm {...props} onSuccess={() => setIsOpen(false)} />
                    </div>
                </div>
            )}
        </div>
    );
}