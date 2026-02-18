'use server'

import { prisma } from "@/src/lib/prisma"; 
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Creates a new exam entry and associated details
 * @param formData form data containing title, examDate, maxTimePerDay
 * @returns {Promise<Object>} success status and created exam, or error message
 */

export async function createExam(formData: FormData) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        throw new Error("Unauthorised");
    }

    const title = formData.get("title") as string;
    const examDate = new Date(formData.get("examDate") as string);
    const maxTimePerDay = parseInt(formData.get("maxTimePerDay") as string);

    try {
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
        return { success: true, exam: newExam};
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
        const session = await getServerSession(authOptions);
        if (!session.user?.id) throw new Error("Unauthorised");

        await prisma.exam.delete({
            where: {
                id: examId,
                userId: session.user.id
            }
        });

        revalidatePath("/exam-planner")
    }