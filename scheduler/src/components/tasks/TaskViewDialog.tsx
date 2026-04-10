/**
 * @file TaskViewDialog.tsx
 * @description A read-only modal interface for inspecting task metadata.
 */

"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { X, CheckCircle2 } from "lucide-react";
import { LunarCard } from "../ui/LunarCard";
import { useUI } from "@/context/UIContext";

interface TaskViewDialogProps {
	task: any | null;
	isOpen: boolean;
	onClose: () => void;
	onEdit?: (taskId: string) => void;
	getPriorityStyle?: (priority: string) => string;
	onReward?: (rewards: any) => void;
}

/**
 * Read-only dialog displaying task details.
 * @param {any | null} task The task to display.
 * @param {boolean} isOpen Whether the dialog is visible or not.
 * @param {Function} onClose Callback to close the dialog.
 * @param {Function} onEdit Optional callback to open the edit dialog.
 * @param {Function} getPriorityStyle Optional function to get priority badge styles.
 * @param {Function} onReward Optional callback fired when XP rewards are received.
 * @returns
 */
export function TaskViewDialog({
	task,
	isOpen,
	onClose,
	onEdit,
	getPriorityStyle,
	onReward,
}: TaskViewDialogProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const { setIsModalOpen } = useUI();

	useEffect(() => {
		setIsModalOpen(isOpen);
		return () => setIsModalOpen(false);
	}, [isOpen, setIsModalOpen]);

	// Return early if dialog shouldn't be open or task is missing
	if (!isOpen || !task) return null;

	const handleCompleteTask = async () => {
		setLoading(true);
		try {
			const res = await fetch(`/api/tasks/${task.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					status: "completed",
					completed: true,
				}),
			});

			if (res.ok) {
				const data = await res.json();
				router.refresh();
				onClose();
				if (data.rewards && onReward) onReward(data.rewards);
			}
		} catch (error) {
			console.error("Failed to update task:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		/* Background Overlay */
		<div
			className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xl z-[9999]"
			onClick={onClose}
		>
			{/* Lunar Wrapper */}
			<LunarCard
				className="w-full max-w-[500px] relative p-8 bg-[#111629]/95 border-white/10 shadow-2xl rounded-2xl"
				onClick={(e: React.MouseEvent) => e.stopPropagation()}
			>
				{/* Close Button */}
				<Button
					onClick={onClose}
					className="absolute top-5 right-6 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg p-1 h-auto w-auto"
				>
					<X size={24} />
				</Button>

				{/* Title */}
				<div className="mb-8">
					<h3 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
						{task.title}
						{task.status === "completed" && (
							<CheckCircle2 className="text-green-500 h-6 w-6" />
						)}
					</h3>
					<p className="text-white/30 text-xs font-black uppercase tracking-[0.3em] mt-2">
						Task Details
					</p>
				</div>

				{/* Data Rows */}
				<div className="space-y-6 py-4">
					<div className="border-b border-white/5 pb-4">
						<label className="text-xs font-black uppercase tracking-[0.2em] text-blue-400/90 mb-2 ml-1 block text-shadow: 0 0 10px rgba(96, 165, 250, 0.2)">
							Description
						</label>
						<p className="text-base text-white/70">
							{task.description || "No description provided"}
						</p>
					</div>

					<div className="border-b border-white/5 pb-4">
						<label className="text-xs font-black uppercase tracking-[0.2em] text-blue-400/90 mb-2 ml-1 block">
							Priority
						</label>
						<p className="mt-2">
							<span
								className={`text-sm px-3 py-1.5 rounded-full border font-bold uppercase tracking-wider inline-block ${getPriorityStyle?.(task.priority) ?? ""}`}
							>
								{task.priority || "None"}
							</span>
						</p>
					</div>

					<div className="border-b border-white/5 pb-4">
						<label className="text-xs font-black uppercase tracking-[0.2em] text-blue-400/90 mb-2 ml-1 block">
							Estimated Time
						</label>
						<p className="text-base text-white/70">
							{task.duration > 0
								? `${Math.floor(task.duration / 60)}h ${task.duration % 60}m`
								: "No estimate set"}
						</p>
					</div>

					<div className="border-b border-white/5 pb-4">
						<label className="text-xs font-black uppercase tracking-[0.2em] text-blue-400/90 mb-2 ml-1 block">
							Study Resource
						</label>
						{task.url ? (
							<a
								href={task.url}
								target="_blank"
								rel="noopener noreferrer"
								className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-semibold"
								onClick={(e) => e.stopPropagation()}
							>
								View Resource →
							</a>
						) : (
							<p className="text-base text-white/70">
								No resource attached
							</p>
						)}
					</div>

					<div className="border-b border-white/5 pb-4">
						<label className="text-xs font-black uppercase tracking-[0.2em] text-blue-400/90 mb-2 ml-1 block">
							Due Date
						</label>
						<p className="text-base text-white/70">
							{task.dueDate
								? new Date(task.dueDate).toLocaleDateString(
										"en-GB",
										{
											day: "numeric",
											month: "long",
											year: "numeric",
										},
									)
								: "No due date set"}
						</p>
					</div>

					<div className="border-b border-white/5 pb-4">
						<label className="text-xs font-black uppercase tracking-[0.2em] text-blue-400/90 mb-2 ml-1 block">
							Linked Exams
						</label>
						<p className="text-base text-white/70">
							{task.exam?.title || "Not linked to an exam"}
						</p>
					</div>

					<div>
						<label className="text-xs font-black uppercase tracking-[0.2em] text-blue-400/90 mb-2 ml-1 block">
							Subtasks
						</label>
						<ul className="list-disc list-inside text-base text-white/70 mt-2 space-y-2">
							{task.subtasks?.length > 0 ? (
								task.subtasks.map(
									(sub: string, index: number) => (
										<li key={index} className="ml-1">
											{sub}
										</li>
									),
								)
							) : (
								<li className="text-white/50">No subtasks</li>
							)}
						</ul>
					</div>
				</div>

				{/* Footer Buttons */}
				<div className="flex flex-col sm:flex-row gap-3 mt-8">
					<Button
						variant="outline"
						onClick={onClose}
						className="flex-1 bg-white/10 text-white border-white/10 hover:bg-white/20 font-semibold"
					>
						Close
					</Button>
					{task.status !== "completed" && (
						<Button
							onClick={handleCompleteTask}
							disabled={loading}
							className="flex-1 bg-blue-300 hover:bg-blue-400 text-gray-950 gap-2 shadow-[0_0_30px_rgba(90,150,255,0.25)] hover:shadow-[0_0_50px_rgba(90,150,255,0.45)] font-bold"
						>
							<CheckCircle2 className="h-5 w-5" />
							{loading ? "Completing..." : "Mark as Done"}
						</Button>
					)}
				</div>
			</LunarCard>
		</div>
	);
}
