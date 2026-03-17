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

/** Get session user or return unauthorized response */
async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user;
}

/** Check if user is admin in a conversation */
async function isAdmin(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  return participant?.role === "admin";
}

/** Safely trigger a Pusher event */
async function trigger(channel: string, event: string, data: any) {
  try {
    await pusher.trigger(channel, event, data);
  } catch (err) {
    console.error(`Pusher ${event} error:`, err);
  }
}

/** Promote next oldest member to admin */
async function promoteNextAdmin(conversationId: string, excludeUserId: string) {
  const nextAdmin = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId: { not: excludeUserId } },
    orderBy: { joinedAt: "asc" },
  });

  if (!nextAdmin) return;

  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId: nextAdmin.userId } },
    data: { role: "admin" },
  });
}

/** Removes a participant from the conversation. */
async function removeMember(conversationId: string, targetUserId: string) {
  const leavingMember = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: targetUserId } },
  });

  if (!leavingMember) return;

  // Promote next admin if needed
  if (leavingMember.role === "admin") await promoteNextAdmin(conversationId, targetUserId);

  await prisma.conversationParticipant.delete({
    where: { conversationId_userId: { conversationId, userId: targetUserId } },
  });

  // Notify removed member
  await trigger(`user-${targetUserId}`, "conversation-deleted", { id: conversationId });

  // Notify remaining participants
  const remaining = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { userId: true },
  });

  await Promise.all(
    remaining.map((p) =>
      trigger(`user-${p.userId}`, "conversation-updated", { id: conversationId, refetch: true })
    )
  );
}


/**
 * POST /api/conversations/[conversationId]/members
 * Adds a user to the conversation. Requires the requester to be an admin.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = await params;
  const { userId } = await req.json();

  if (!(await isAdmin(conversationId, user.id))) {
    return NextResponse.json({ error: "Only admins can add members" }, { status: 403 });
  }

  const member = await prisma.conversationParticipant.create({
    data: { conversationId, userId, role: "member" },
    include: {
      user: { select: { id: true, username: true, fname: true, lname: true, pfp: true } },
    },
  });

  // Notify the new member so the conversation appears in their sidebar immediately
  await trigger(`user-${userId}`, "conversation-updated", {
    id: conversationId,
    refetch: true,
  });

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
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = await params;
  const { userId, role } = await req.json();

  if (!(await isAdmin(conversationId, user.id))) {
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
 * - Any member can leave the groupchat.
 * - Only admins can remove others.
 * - If the removed user is the only admin, the next oldest participant is promoted.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = await params;
  const body = await req.json().catch(() => ({}));
  const targetUserId = body.userId ?? user.id;
  const isSelf = targetUserId === user.id;

  if (!isSelf && !(await isAdmin(conversationId, user.id))) {
    return NextResponse.json({ error: "Only admins can remove members" }, { status: 403 });
  }

  await removeMember(conversationId, targetUserId);
  return NextResponse.json({ success: true });
}