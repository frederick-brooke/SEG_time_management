"use client";

/**
 * Exam Planner dashboard page.
 * Displays all user exams with progress tracking and allows creating, editing, and deleting exams.
 */

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getMyExams, deleteExam } from "@/app/actions/examActions";
import ExamFormDialog from "@/components/exams/ExamFormDialog";
import Link from "next/link";
import LunarThemeWrapper from "@/components/layout/LunarThemeWrapper";
import { Button } from "@/components/ui/Button";

type Exam = any;

/**
 * The dashboard for exam planning.
 * Displays a grid of active exams with revision progress
 * as well as tools for adding or removing study plans.
 */
export default function ExamPlannerPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const [exams, setExams] = useState<Exam[]>([]);

	useEffect(() => {
		if (status === "unauthenticated") {
			router.push("/login");
		} else if (status === "authenticated" && session?.user?.id) {
			// Load exams when authenticated
			async function loadExams() {
				const data = await getMyExams();
				setExams(data);
			}
			loadExams();
		}
	}, [status, session?.user?.id, router]);

	/**
	 * Handler for removing an exam and its associated data.
	 * @param {string}} id The database ID of the exam.
	 */
	const handleDelete = async (id: string) => {
		if (confirm("Are you sure you want to delete this exam entry?")) {
			try {
				await deleteExam(id);
				setExams(exams.filter((exam) => exam.id !== id));
			} catch (error) {
				console.error("Failed to delete:", error);
				alert("Could not delete exam");
			}
		}
	};

	if (status === "loading") return <p className="p-4">Loading session</p>;

	return (
		<LunarThemeWrapper>
			<div className="flex flex-1 flex-col p-8 gap-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#020617] to-[#020617] min-h-screen text-white">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="lunar-page-title">Exam Planner</h1>
						<p className="lunar-page-subtitle">
							Organise your revision
						</p>
					</div>
					<ExamFormDialog
						onExamAdded={(newExam: Exam) =>
							setExams([...exams, newExam])
						}
					/>
				</div>

				{/* Exam Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{exams.length > 0 ? (
						exams.map((exam: Exam) => {
							const totalTasks = exam.tasks?.length || 0;
							const completedTasks =
								exam.tasks?.filter(
									(t: any) => t.status === "completed",
								).length || 0;
							const progress =
								totalTasks > 0
									? Math.round(
											(completedTasks / totalTasks) * 100,
										)
									: 0;

							return (
								<div
									key={exam.id}
									className="lunar-card group relative p-8 flex flex-col gap-6"
								>
									{/* Exam Title and Tasks */}
									<div className="flex justify-between items-start gap-4">
										<Link
											href={`/exam-planner/${exam.id}`}
											className="flex-1 group"
										>
											<h2 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
												{exam.title}
											</h2>
										</Link>
										<span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20 uppercase whitespace-nowrap">
											{totalTasks}{" "}
											{totalTasks === 1
												? "Task"
												: "Tasks"}
										</span>
									</div>

									{/* Exam Date and Daily Goal */}
									<p className="bg-white/5 border border-white/10 text-blue-400 px-4 py-1.5 rounded-full text-[11px] font-black tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.4)]">
										Exam Date:{" "}
										{new Date(
											exam.examDate,
										).toLocaleDateString()}
									</p>
									<p className="text-sm font-medium mt-1">
										Daily Goal: {exam.maxTimePerDay} mins
									</p>

									{/* Progress Section */}
									<div className="space-y-2 py-2">
										<div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
											<span>Revision Progress</span>
											<span>{progress}</span>
										</div>
										<div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
											<div
												className="h-full bg-blue-500 transition-all duration-500 ease-in-out"
												style={{
													width: `${progress}%`,
												}}
											/>
										</div>
									</div>

									{/* Action Footer */}
									<div className="flex gap-2">
										<ExamFormDialog
											editingExam={exam}
											onExamUpdated={(updated: Exam) => {
												setExams(
													exams.map((e: Exam) =>
														e.id === updated.id
															? updated
															: e,
													),
												);
											}}
										/>
										<Button
											onClick={() =>
												handleDelete(exam.id)
											}
											className="bg-red-500/20 text-red-400 border border-red-500/30 font-black uppercase tracking-widest text-xs py-2 px-6 rounded-xl hover:bg-red-500/30 transition-all"
										>
											Delete Exam
										</Button>
									</div>
								</div>
							);
						})
					) : (
						<div className="col-span-full py-20 border-2 border-dashed rounded-2xl text-center">
							<p className="text-muted-foreground">
								No exams found
							</p>
						</div>
					)}
				</div>
			</div>
		</LunarThemeWrapper>
	);
}
