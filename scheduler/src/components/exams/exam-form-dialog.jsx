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
                    ? "text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors px-2 py-1"
                    : "bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl px-6 uppercase tracking-widest text-xs shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all"}
            >
                {props.editingExam ? "Edit Details" : "+ Add Exam"} {/* Dynamic label */}
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-[#020617]/95 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
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