'use server'

import { prisma } from "@/src/lib/prisma"; 
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";
import { examPlannerLogic  } from "@/src/lib/examPlannerLogic";

/**
 * Creates a new exam entry and associated details
 * @param formData form data containing title, examDate, maxTimePerDay
 * @returns {Promise<Object>} success status and created exam, or error message
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
 * Fetches all exams belonging to the current authenticated user
 * @returns {Promise<Array>} List of user exams with linked tasks and materials
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
 * Deletes an exam and its associated revision materials and tasks
 * @param examId The database ID of the exam to remove
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
        return { success: true };

    } catch (error) {
        console.error("Plan generation error:", error);
        return { success: false, error: "An error occurred while generating your exam plan"};
    }
}

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
            durationHours: hours.toString(),
            durationMins: mins.toString(),
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