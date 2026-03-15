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

  // The new member's sidebar should refetch so the group appears for them
  await pusher
    .trigger(`user-${userId}`, "conversation-updated", { id: conversationId, refetch: true })
    .catch((err) => console.error("Pusher add-member error:", err));

  return NextResponse.json(member);
}

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

  // The removed/leaving user's sidebar should drop this conversation
  await pusher
    .trigger(`user-${targetUserId}`, "conversation-deleted", { id: conversationId })
    .catch((err) => console.error("Pusher leave error:", err));

  // The remaining participants should refetch (member count changed, etc.)
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