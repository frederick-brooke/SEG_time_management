import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

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


export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = await params;

  await prisma.conversationParticipant.delete({
    where: { conversationId_userId: { conversationId, userId: session.user.id } },
  });

  return NextResponse.json({ success: true });
}