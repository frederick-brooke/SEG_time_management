import { prisma } from "./prisma";
import { NotificationType } from "@prisma/client";

export async function createNotification(userId: string, message: string, type: NotificationType, expiresAt?: Date) {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                message,
                type: type || NotificationType.INFO, 
                expiresAt: expiresAt || null
            }
        });
        return notification;
    } catch (error) {
        console.error("Error creating notification:", error);
        throw error;
    }
}