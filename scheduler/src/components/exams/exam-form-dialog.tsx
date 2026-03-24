"use client";

import React, { useState } from "react";
import ExamForm from "./ExamForm";

/**
 * A dialog wrapper which toggle the visibility of the ExamForm
 * @param {Object} props The component properties.
 * @returns {JSX.Element} The rendered dialog and trigger button.
 */
export default function ExamFormDialog(props) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div>
            <button
                onClick={() => setIsOpen(true)}
                className={props.editingExam
                    ? "lunar-button-ghost"
                    : "lunar-button-primary"}
            >
                {props.editingExam ? "Edit Details" : "+ Add Exam"} {/* Dynamic label */}
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="lunar-glass p-8 w-full max-w-lg">
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-6">
                            {props.editingExam ? "Edit Exam" : "Setup New Exam"}    
                        </h2>
                        
                        <ExamForm {...props} onSuccess={() => setIsOpen(false)} />
                    </div>
                </div>
            )}
        </div>
    );
}