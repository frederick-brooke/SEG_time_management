/**
 * A modal wrapper for the exam configuration form.
 * Manages visibility, background scroll-locking, and backdrop dismissal
 * to provide a polished user interface.
 */
"use client";

import React, { useState, useEffect } from "react";
import ExamForm from "./ExamForm";
import { Button } from "../ui/Button";
import { useUI } from "@/context/UIContext";

/**
 * A dialog wrapper which toggle the visibility of the ExamForm
 * @param {Object} props The component properties.
 * @returns {JSX.Element} The rendered dialog and trigger button.
 */
export default function ExamFormDialog(props) {
	const [isOpen, setIsOpen] = useState(false);
	const { setIsModalOpen } = useUI();

	useEffect(() => {
		setIsModalOpen(isOpen);
		return () => setIsModalOpen(false);
	}, [isOpen, setIsModalOpen]);

	return (
		<div>
			<Button
				onClick={() => setIsOpen(true)}
				className={
					props.editingExam
						? "lunar-button-ghost"
						: "lunar-button-primary"
				}
			>
				{props.editingExam ? "Edit Details" : "+ Add Exam"}{" "}
				{/* Dynamic label */}
			</Button>

			{isOpen && (
				<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
					<div className="lunar-glass p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
						<h2 className="text-2xl font-bold uppercase tracking-tight text-white mb-6">
							{props.editingExam ? "Edit Exam" : "Setup New Exam"}
						</h2>

						<ExamForm
							{...props}
							onSuccess={() => setIsOpen(false)}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
