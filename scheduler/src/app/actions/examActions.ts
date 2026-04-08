"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { revalidatePath } from "next/cache";
import { examPlannerLogic } from "lib/examPlannerLogic";
import { createNotification } from "./notifications";
import { NotificationType } from "@prisma/client";
import { saveTopicAsTask } from "./examNotifications";

export async function updateExamSettings(
	examId: string,
	data: { title?: string; maxTimePerDay?: number; examDate?: Date },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id)
			return { success: false, error: "Unauthorised" };

		const updated = await prisma.exam.update({
			where: { id: examId, userId: session.user.id },
			data: data,
		});

		revalidatePath(`/exam-planner/${examId}`);
		return { success: true, data: updated };
	} catch (error) {
		return { success: false, error: "Failed to update settings" };
	}
}

export async function createExam(formData: FormData) {
	const session = await getServerSession(authOptions);

	if (!session?.user?.id) {
		return { success: false, error: "Unauthorised" };
	}

	try {
		const title = formData.get("title") as string;
		const examDate = new Date(formData.get("examDate") as string);
		const startTimeStr = formData.get("startTime") as string;
		const endTimeStr = formData.get("endTime") as string;
		const maxTimePerDay = parseInt(formData.get("maxTimePerDay") as string);

		const datePart = formData.get("examDate") as string;
		const examStart = new Date(`${datePart}T${startTimeStr}:00`);
		const examEnd = new Date(`${datePart}T${endTimeStr}:00`);

		const result = await prisma.$transaction(async (tx) => {
			const category = await tx.category.create({
				data: {
					userId: session.user.id,
					name: title,
					color: "#ef4444",
				},
			});

			const exam = await tx.exam.create({
				data: {
					userId: session.user.id,
					title,
					examDate: examStart,
					endTime: examEnd,
					maxTimePerDay,
					unavailableDays: [],
				},
			});

			await tx.event.create({
				data: {
					userId: session.user.id,
					title: `Exam: ${title}`,
					start: examStart,
					end: examEnd,
					category: category.name,
				},
			});

			return exam;
		});

		revalidatePath("/exam-planner");
		revalidatePath("/calendar");

		return { success: true, data: result };
	} catch (error) {
		console.error("Error creating exam:", error);
		return { success: false, error: "Failed to create exam" };
	}
}

export async function getMyExams() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return [];

	return await prisma.exam.findMany({
		where: { userId: session.user.id },
		include: {
			tasks: true,
			revisionMaterials: true,
		},
		orderBy: { examDate: "asc" },
	});
}

export async function deleteExam(examId: string) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id)
			return { success: false, error: "Unauthorised" };

		const exam = await prisma.exam.findUnique({
			where: { id: examId, userId: session.user.id },
			select: { title: true },
		});

		if (!exam) return { success: false, error: "Exam not found" };

		await prisma.$transaction([
			// Delete the calendar event created for this exam
			prisma.event.deleteMany({
				where: {
					userId: session.user.id,
					title: `Exam: ${exam.title}`,
				},
			}),
			// Delete all study tasks linked to this exam
			prisma.task.deleteMany({
				where: { examId: examId },
			}),
			// Delete the category that was auto-created with the exam
			prisma.category.deleteMany({
				where: {
					userId: session.user.id,
					name: exam.title,
				},
			}),
			// Delete the exam itself
			prisma.exam.delete({
				where: { id: examId, userId: session.user.id },
			}),
		]);

		revalidatePath("/exam-planner");
		revalidatePath("/calendar");
		revalidatePath("/exam-hub");
		return { success: true };
	} catch (error) {
		return { success: false, error: "Failed to delete exam" };
	}
}

export async function getExamById(id: string) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return null;

	return await prisma.exam.findUnique({
		where: { id: id },
		include: {
			tasks: true,
			revisionMaterials: true,
		},
	});
}

export async function generateExamPlan(
	examId: string,
	topics: { title: string; duration: number; url?: string }[],
) {
	try {
		const exam = await prisma.exam.findUnique({
			where: { id: examId },
			select: {
				examDate: true,
				unavailableDays: true,
				maxTimePerDay: true,
				userId: true,
			},
		});

		if (!exam) return { error: "Exam not found" };

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const availableDates = examPlannerLogic.getAvailableDates(
			today,
			exam.examDate,
			exam.unavailableDays,
		);

		let dateIndex = 0;
		let dailyTimeSpent = 0;

		for (const topic of topics) {
			if (dateIndex >= availableDates.length) break;

			const { nextIndex, resetTime } = getTargetDateIndex(
				dateIndex,
				dailyTimeSpent,
				topic.duration,
				exam.maxTimePerDay,
			);

			dateIndex = nextIndex;
			if (resetTime) dailyTimeSpent = 0;

			if (dateIndex < availableDates.length) {
				await saveTopicAsTask(
					examId,
					exam.userId,
					topic,
					availableDates[dateIndex],
				);
				dailyTimeSpent += topic.duration;
			}
		}

		revalidatePath(`/exam-planner`);
		revalidatePath(`/exam-hub`);
		revalidatePath(`/exam-planner/${examId}`);

		await createNotification(
			exam.userId,
			"Study Plan Generated",
			`Your revision plan for this exam is ready.`,
			NotificationType.SUCCESS,
		);

		return { success: true };
	} catch (error) {
		console.error("Plan generation error:", error);
		return {
			success: false,
			error: "An error occurred while generating your exam plan",
		};
	}
}

export async function updateExamUnavailableDays(
	examId: string,
	days: Date[] | undefined,
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id)
			return { success: false, error: "Unauthorised" };

		const cleanedDays = days
			? days.map((d) => {
					const date = new Date(d);
					date.setHours(0, 0, 0, 0);
					return date;
				})
			: [];

		const updatedExam = await prisma.exam.update({
			where: {
				id: examId,
				userId: session.user.id,
			},
			data: {
				unavailableDays: cleanedDays,
			},
			include: {
				tasks: true,
				revisionMaterials: true,
			},
		});

		revalidatePath(`/exam-planner/${examId}`);
		return { success: true, data: updatedExam };
	} catch (error) {
		console.error("Update days error:", error);
		return { success: false, error: "Failed to update unavailable days" };
	}
}

function getTargetDateIndex(
	currentDateIndex: number,
	currentDailyTime: number,
	topicDuration: number,
	maxTimePerDay: number,
): { nextIndex: number; resetTime: boolean } {
	if (
		currentDailyTime + topicDuration > maxTimePerDay &&
		currentDailyTime > 0
	) {
		return { nextIndex: currentDateIndex + 1, resetTime: true };
	}
	return { nextIndex: currentDateIndex, resetTime: false };
}
