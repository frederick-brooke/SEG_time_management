import { NextRequest, NextResponse } from 'next/server';
import { prisma } from 'lib/prisma';
import { getServerSession } from 'next-auth'; 


// GET /api/notifications - Fetch user notifications
// Returns the 20 most recent notifications that are either non-expiring or not yet expired
export async function GET(req: NextRequest) {
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
            take: 20
        });

        return NextResponse.json({ notifications });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}


// PATCH /api/notifications - Mark a notification as read
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { notificationId } = await req.json();

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

// POST /api/notifications - Create a new notification (TESTING PURPOSES ONLY, NOT EXPOSED TO CLIENT)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession();

        // if (!session?.user?.id) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const { message, type, link, expiresAt } = await req.json();

        if (!message || !type) {
            return NextResponse.json({ error: 'Message and type are required' }, { status: 400 });
        }

        const notification = await prisma.notification.create({
            data: {
                userId: session.user.id,
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
