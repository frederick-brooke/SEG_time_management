import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId: session.user.id } },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, username: true, fname: true, lname: true, pfp: true } },
        },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  return NextResponse.json(conversations);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, memberIds, isGroup } = await req.json();

  if (!isGroup && memberIds.length === 1) {
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        participants: { every: { userId: { in: [session.user.id, memberIds[0]] } } },
      },
      include: { participants: { include: { user: true } } },
    });
    if (existing) return NextResponse.json(existing);
  }

  const allMemberIds: string[] = [...new Set([session.user.id, ...memberIds])];

  const conversation = await prisma.conversation.create({
    data: {
      isGroup: !!isGroup,
      name: isGroup ? name : null,
      createdById: session.user.id,
      participants: {
        create: allMemberIds.map((userId) => ({
          userId,
          role: userId === session.user.id ? "admin" : "member",
        })),
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