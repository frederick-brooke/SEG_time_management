import { prisma } from "./prisma";
import { NotificationType } from "@prisma/client";

export async function createNotification(message: string, type: NotificationType, userId?: string, link?: string, expiresAt?: Date) {
    try {
        if (!message || !type) {
            console.error('Message and type are required to create a notification');
            return { notification: null, error: 'Message and type are required' };
        }

        const notification = await prisma.notification.create({
            data: {
                userId: userId ? userId : null,
                message,
                type,
                link: link? link : null,
                expiresAt: expiresAt ? new Date(expiresAt) : null
            }
        });

        return { notification, error: null };

    } catch (err) {
        console.error(err);
        return { notification: null, error: 'Failed to create notification' };
    }
}
