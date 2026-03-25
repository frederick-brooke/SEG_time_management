'use server'

import { prisma } from "lib/prisma";
import { createNotification } from "./notifications";
import { NotificationType } from "@prisma/client";

/**
 * Persists a study topic as a Task and optional RevisionMaterial in the database.
 * @param {string} examId Linked exam ID
 * @param {string} userId Owner of the task
 * @param {any} topic THe topic object containing title, duration and URL
 * @param {Date} dueDate The scheduled date for this study task.
 */
export async function saveTopicAsTask(examId: string, userId: string, topic: any, dueDate: Date) {
    const exam = await prisma.exam.findUnique({
        where: { id: examId },
        select: { title: true }
    });

    await prisma.task.create({
        data: {
            title: `${topic.title}`,
            status: "todo",
            priority: "Medium",
            dueDate: dueDate,
            examId: examId,
            userId: userId,
            duration: topic.duration,
            url: topic.url || null,
            category: exam?.title || "Exam",
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

/**
 * Deadline minder protocol.
 * Scans the database for tasks and exams due within the next 72 hours.
 * Automatically dispatches system notifications for urgent items
 * that haven't been completed yet.
 * @param {string} userId The unique identifier of the user to check.
 * @returns {Promise<void>} Resolves once all notifications have been processed. 
 */
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