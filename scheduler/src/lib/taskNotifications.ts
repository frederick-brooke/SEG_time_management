import { createNotification } from "@/app/actions/notifications";
import { NotificationType } from "@prisma/client";

/**
 * Sends a notification after a task is created or updated.
 * @param {string} userId The ID of the user who owns the task.
 * @param {string} taskTitle The title of the task.
 * @param {boolean} isEditing Whether the task was updated or newly created.
 */

export async function notifyTaskSaved(userId: string, taskTitle: string, isEditing: boolean) {
    await createNotification(
        userId,
        isEditing ? "Task Updated" : "Task Created",
        isEditing
        ? `"${taskTitle}" has been updated.`
        : `"${taskTitle}" has been added to your tasks.`,
        isEditing ? NotificationType.INFO : NotificationType.SUCCESS
    );
}