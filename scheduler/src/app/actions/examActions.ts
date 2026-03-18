'use server'

import { prisma } from "lib/prisma"; 
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { revalidatePath } from "next/cache";
import { examPlannerLogic  } from "lib/examPlannerLogic";
import { createNotification } from "./notifications";
import { NotificationType } from "@prisma/client";

/**
 * Updates specific settings for an existing exam record.
 * @param {string} examId Unique ID of the exam to update.
 * @param {Object} data The fields to update (title, maxTimePerDay, examDate).
 * @returns {Promise<Object>} The updated exam data or an error message.
 */
export async function updateExamSettings(examId: string, data: { title?: string, maxTimePerDay?: number, examDate?: Date}) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false, error: "Unauthorised" };

        const updated = await prisma.exam.update({
            where: { id: examId, userId: session.user.id },
            data: data
        });

        revalidatePath(`/exam-planner/${examId}`);
        return { success: true, data: updated };
    } catch (error) {
        return { success: false, error: "Failed to update settings" };
    }
}

/**
 * Creates a new exam entry and associated details in the database.
 * @param {FormData} formData Form data containing title, examDate and maxTimePerDay.
 * @returns {Promise<Object>} Success status and created exam, or error message.
 */
export async function createExam(formData: FormData) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return { success: false, error: "Unauthorised" };
    }

    try {
        const title = formData.get("title") as string;
        const examDate = new Date(formData.get("examDate") as string);
        const maxTimePerDay = parseInt(formData.get("maxTimePerDay") as string);

        const newExam = await prisma.exam.create({
            data: {
                userId: session.user.id,
                title,
                examDate,
                maxTimePerDay,
                unavailableDays: [],
            },
        });

        revalidatePath("/exam-planner");
        return { success: true, data: newExam};
    }   catch (error) {
            console.error("Error creating exam:", error)
            return { success: false, error: "Failed to create exam"};
        }
}


/**
 * Fetches all exams belonging to the current authenticated user.
 * @returns {Promise<Array>} List of user exams with linked tasks and materials.
 */

export async function getMyExams() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return []

    return await prisma.exam.findMany({
        where: { userId: session.user.id },
        include: {
            tasks: true,
            revisionMaterials: true,
        },
        orderBy: { examDate: 'asc'}
    });
}

/**
 * Deletes an exam and its associated revision materials and tasks.
 * @param {string} examId The database ID of the exam to remove.
 */

export async function deleteExam(examId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false, error: "Unauthorised" };

        await prisma.exam.delete({
            where: { id: examId, userId: session.user.id }
        });

        revalidatePath("/exam-planner")
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete exam" };
    }

}

/**
 * Retrieves a single exam by its ID, inluding all of the tasks and materials linked to it.
 * @param {string} id The database ID of the exam.
 * @returns {Promise<Object|null\>} The exam record or null if not found or unauthorised.
 */
export async function getExamById(id: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    return await prisma.exam.findUnique({
        where: {id: id},
        include: {
            tasks: true,
            revisionMaterials: true,
        }
    });
}

/**
 * Automated study plan generator that maps revision topics to available dates.
 * @param {string} examId The unique ID of the target exam.
 * @param {Object[]} topics Array of topics containing title, duration and optional URL.
 * @returns {Promise<Object>} Success status or an error message if generation fails.
 */
export async function generateExamPlan(examId: string, topics: { title:string, duration: number, url?: string }[]) {
    try {
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            select: { examDate: true, unavailableDays: true, maxTimePerDay: true, userId: true }
        });

        if (!exam) return { error: "Exam not found" };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const availableDates = examPlannerLogic.getAvailableDates(today, exam.examDate, exam.unavailableDays);
        
        let dateIndex = 0;
        let dailyTimeSpent = 0;

        for (const topic of topics) {
            if (dateIndex >= availableDates.length) break;

            if (examPlannerLogic.calculateDaysRequired([{duration: dailyTimeSpent}, topic ], exam.maxTimePerDay) > 1 && dailyTimeSpent > 0) {
                dateIndex++;
                dailyTimeSpent = 0;
            }

            if (dateIndex < availableDates.length) {
                await saveTopicAsTask(examId, exam.userId, topic, availableDates[dateIndex]);
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
            NotificationType.SUCCESS
        );

        return { success: true };

        

    } catch (error) {
        console.error("Plan generation error:", error);
        return { success: false, error: "An error occurred while generating your exam plan"};
    }
}

/**
 * Updates the list of dates the user is unavailable to study for a specific exam.
 * @param {string} examId The unique ID of the exam
 * @param {Date[] | undefined} days Array of dates to be marked as unavailable for revision for the specific exam.
 * @returns {Promise<Object>} Success status and updated exam record.
 */
export async function updateExamUnavailableDays(examId: string, days: Date[] | undefined) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return { success: false, error: "Unauthorised" };

        const cleanedDays = days ? days.map(d => {
            const date = new Date(d);
            date.setHours(0, 0, 0, 0);
            return date;
        }) : [];

        const updatedExam = await prisma.exam.update({
            where: {
                id: examId,
                userId: session.user.id
            },
            data: {
                unavailableDays: cleanedDays
            },
            include: {
                tasks: true,
                revisionMaterials: true,
            }
        });

        revalidatePath(`/exam-planner/${examId}`);
        return { success: true, data: updatedExam};

    } catch (error) {
        console.error("Update days error:", error);
        return { success: false, error: "Failed to update unavailable days" };
    }
}

/**
 * Persists a study topic as a Task and optional RevisionMaterial in the database.
 * @param {string} examId Linked exam ID
 * @param {string} userId Owner of the task
 * @param {any} topic THe topic object containing title, duration and URL
 * @param {Date} dueDate The scheduled date for this study task.
 */
async function saveTopicAsTask(examId: string, userId: string, topic: any, dueDate: Date) {
    const hours = Math.floor(topic.duration / 60);
    const mins = topic.duration % 60;

    await prisma.task.create({
        data: {
            title: `${topic.title}`,
            status: "todo",
            priority: "Medium",
            dueDate: dueDate,
            examId: examId,
            userId: userId,
            duration: topic.duration,
            url: topic.url || null
        }
    });

    if (topic.url) {
        await prisma.revisionMaterial.create({
            data: {
                title: topic.title,
                url: topic.url,
                examId: examId,
                type: "Link",
                duration: topic.duration
            }
        });
    }

}

export async function checkUpcomingDeadlines(userId: string) {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const urgentTasks = await prisma.task.findMany({
        where: {
            userId,
            status: { not: "completed" },
            dueDate: { gte: now, lte: threeDaysFromNow }
        }
    });

    const urgentExams = await prisma.exam.findMany({
        where: {
            userId,
            examDate: { gte: now, lte: threeDaysFromNow }
        }
    });

    for (const task of urgentTasks) {
        await createNotification(
            userId,
            "Task Due Soon",
            `"${task.title}" is due ${new Date(task.dueDate).toLocaleDateString()}`,
            NotificationType.WARNING
        );
    }

    for (const exam of urgentExams) {
        await createNotification(
            userId,
            "Exam Approaching",
            `"${exam.title}" is on ${new Date(exam.examDate).toLocaleDateString()}`,
            NotificationType.WARNING
        );
    }
}