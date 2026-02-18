import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { targetUserId } = await req.json();

  // Check if a conversation already exists
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: session.user.id } } },
        { participants: { some: { userId: targetUserId } } },
      ],
    },
  });

  if (existing) return NextResponse.json(existing);

  const conversation = await prisma.conversation.create({
    data: {
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