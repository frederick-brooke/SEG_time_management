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