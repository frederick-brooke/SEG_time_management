"use server";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from 'lib/prisma';
import { NotificationType } from '@prisma/client';
import { getServerSession } from 'next-auth'; 
import { Not } from '@/src/generated/prisma/internal/prismaNamespace';

// Returns the n (20 default) most recent notifications that are either non-expiring or not yet expired
export async function getNotifications(count: number = 20) {
    try {
        const session = await getServerSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const notifications = await prisma.notification.findMany({
            where: {
                userId: session.user.id,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: count
        });

        return NextResponse.json({ notifications });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

export async function markNotificationAsRead(notificationId: string) {
    try {
        const session = await getServerSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const notification = await prisma.notification.findUnique({
            where: { id: notificationId }
        });

        // Ensure the notification exists and belongs to the user
        if (!notification || notification.userId !== session.user.id) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
    }
}

export async function markAllNotificationsAsRead() {
    try {
        const session = await getServerSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.notification.updateMany({
            where: { userId: session.user.id, isRead: false },
            data: { isRead: true }
        });

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
    }
}

export async function createNotification(message: string, type: NotificationType, userId?: string, link?: string, expiresAt?: Date) {
    try {
        const session = await getServerSession();
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!message || !type) {
            return NextResponse.json({ error: 'Message and type are required' }, { status: 400 });
        }

        const notification = await prisma.notification.create({
            data: {
                userId: userId || null,
                message,
                type,
                link,
                expiresAt: expiresAt ? new Date(expiresAt) : null
            }
        });

        return NextResponse.json({ notification });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }
}
