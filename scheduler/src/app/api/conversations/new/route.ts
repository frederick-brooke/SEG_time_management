import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetUserId } = await req.json();

  // Fetch all non-group conversations the current user is in
  const candidates = await prisma.conversation.findMany({
    where: {
      isGroup: false,
      participants: { some: { userId: session.user.id } },
    },
    include: {
      participants: true,
    },
  });

  // Find one with exactly 2 participants: current user + target only
  const existing = candidates.find((c) => {
    const ids = c.participants.map((p) => p.userId);
    return (
      ids.length === 2 &&
      ids.includes(session.user.id) &&
      ids.includes(targetUserId)
    );
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const conversation = await prisma.conversation.create({
    data: {
      isGroup: false,
      participants: {
        create: [{ userId: session.user.id }, { userId: targetUserId }],
      },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, username: true, fname: true, lname: true, pfp: true } },
        },
      },
    },
  });

  return NextResponse.json(conversation);
}