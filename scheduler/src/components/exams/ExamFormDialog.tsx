/**
 * A modal wrapper for the exam configuration form.
 * Manages visibility, background scroll-locking, and backdrop dismissal
 * to provide a polished user interface.
 */
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import ExamForm from "./ExamForm";
import { Button } from "../ui/Button";
import { useUI } from "@/context/UIContext";
import { LunarCard } from "../ui/LunarCard";

/**
 * A dialog wrapper which toggle the visibility of the ExamForm
 * @param {Object} props The component properties.
 * @returns {JSX.Element} The rendered dialog and trigger button.
 */
export default function ExamFormDialog(props) {
	const [isOpen, setIsOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const { setIsModalOpen } = useUI();

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		setIsModalOpen(isOpen);
		return () => setIsModalOpen(false);
	}, [isOpen, setIsModalOpen]);

	const modalContent =
		mounted &&
		isOpen &&
		createPortal(
			<div
				className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
				style={{ isolation: "initial" }}
				onClick={(e) => {
					if (e.target === e.currentTarget) setIsOpen(false);
				}}
			>
				<LunarCard
					className="relative p-8 w-full max-w-lg"
					onClick={(e) => e.stopPropagation()}
				>
					<Button
						onClick={() => setIsOpen(false)}
						className="lunar-close-button !-top-3"
					>
						<X size={20} />
					</Button>

					<div className="mb-8">
						<h3 className="lunar-header">
							{props.editingExam ? "Edit Exam" : "Setup New Exam"}
						</h3>
						<p className="lunar-form-subtitle">
							{props.editingExam
								? "Update your exam details and study goals"
								: "Create a new exam and set your revision goals"}
						</p>
					</div>

					<ExamForm {...props} onSuccess={() => setIsOpen(false)} />
				</LunarCard>
			</div>,
			document.body,
		);

	return (
		<div>
			<Button
				onClick={() => setIsOpen(true)}
				className={
					props.editingExam
						? "px-6 py-3 rounded-2xl bg-white/5 ring-1 ring-white/10 text-white/80 font-medium hover:bg-white/10 transition"
						: "px-6 py-3 rounded-2xl bg-blue-300 text-gray-950 font-semibold shadow-[0_0_30px_rgba(90,150,255,0.25)] hover:shadow-[0_0_50px_rgba(90,150,255,0.45)] transition"
				}
			>
				{props.editingExam ? "Edit Details" : "+ Add Exam"}
			</Button>

			{modalContent}
		</div>
	);
}
