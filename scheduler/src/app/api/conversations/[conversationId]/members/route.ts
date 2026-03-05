import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

// Add a member
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

  return NextResponse.json(member);
}

// Promote/demote a member (admin only)
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

// Remove a member (admin) or leave (self)
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

  // If removing someone else, must be admin
  if (!isSelf) {
    const requester = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: session.user.id } },
    });
    if (requester?.role !== "admin") {
      return NextResponse.json({ error: "Only admins can remove members" }, { status: 403 });
    }
  }

  // If the leaving user is an admin, transfer to earliest joined member
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

  return NextResponse.json({ success: true });
}