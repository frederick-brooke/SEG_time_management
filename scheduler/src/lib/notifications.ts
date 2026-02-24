import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "./prisma";
import { NotificationType } from "@prisma/client";

export async function createNotification(message: string, type: NotificationType, userId?: string, link?: string, expiresAt?: Date) {
    try {
        if (!message || !type) {
            console.error('Message and type are required to create a notification');
            return NextResponse.json({ error: 'Message and type are required' }, { status: 400 });
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

        return NextResponse.json({ notification });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }
}
