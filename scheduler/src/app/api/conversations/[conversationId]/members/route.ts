import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

/**
 * POST /api/conversations/[conversationId]/members
 * Adds a user to the conversation. Requires the requester to be an admin.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = await params;
  const { userId } = await req.json();

  const requester = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: session.user.id } },
  });

  if (requester?.role !== "admin") {
    return NextResponse.json({ error: "Only admins can add members" }, { status: 403 });
  }

  const member = await prisma.conversationParticipant.create({
    data: { conversationId, userId, role: "member" },
    include: { user: { select: { id: true, username: true, fname: true, lname: true, pfp: true } } },
  });

  // Notify the new member so the conversation appears in their sidebar immediately
  await pusher
    .trigger(`user-${userId}`, "conversation-updated", { id: conversationId, refetch: true })
    .catch((err) => console.error("Pusher add-member error:", err));

  return NextResponse.json(member);
}

/**
 * PATCH /api/conversations/[conversationId]/members
 * Updates a participant's role. Requires the requester to be an admin.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = await params;
  const { userId, role } = await req.json();

  const requester = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: session.user.id } },
  });

  if (requester?.role !== "admin") {
    return NextResponse.json({ error: "Only admins can change roles" }, { status: 403 });
  }

  const updated = await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { role },
    include: { user: { select: { id: true, username: true, pfp: true } } },
  });

  return NextResponse.json(updated);
}

/**
 * DELETE /api/conversations/[conversationId]/members
 * Removes a participant from the conversation.
 * - Any member can leave the groupchat.
 * - Only admins can remove others.
 * - If the removed user is the only admin, the next oldest participant is promoted.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = await params;
  const body = await req.json().catch(() => ({}));
  const targetUserId = body.userId ?? session.user.id;
  const isSelf = targetUserId === session.user.id;

  if (!isSelf) {
    const requester = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: session.user.id } },
    });
    if (requester?.role !== "admin") {
      return NextResponse.json({ error: "Only admins can remove members" }, { status: 403 });
    }
  }

  const leavingMember = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: targetUserId } },
  });

  // Promote the next oldest member if the admin is leaving
  if (leavingMember?.role === "admin") {
    const nextAdmin = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: { not: targetUserId } },
      orderBy: { joinedAt: "asc" },
    });
    if (nextAdmin) {
      await prisma.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId: nextAdmin.userId } },
        data: { role: "admin" },
      });
    }
  }

  await prisma.conversationParticipant.delete({
    where: { conversationId_userId: { conversationId, userId: targetUserId } },
  });

  // Drop the conversation from the removed/leaving user's sidebar
  await pusher
    .trigger(`user-${targetUserId}`, "conversation-deleted", { id: conversationId })
    .catch((err) => console.error("Pusher leave error:", err));

  // Notify remaining participants so their member lists stay in sync
  const remaining = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { userId: true },
  });

  await Promise.all(
    remaining.map((p) =>
      pusher
        .trigger(`user-${p.userId}`, "conversation-updated", { id: conversationId, refetch: true })
        .catch((err) => console.error("Pusher remaining error:", err))
    )
  );

  return NextResponse.json({ success: true });
}