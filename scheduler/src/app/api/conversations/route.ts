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

  // Hide conversations where the user has cleared their history and no new messages have arrived since
  const filtered = conversations.filter((conv) => {
    const participant = conv.participants.find((p) => p.userId === session.user.id);
    if (!participant?.deletedAt) return true;
    // Keep it only if a new message arrived after they cleared it
    return conv.lastMessageAt && new Date(conv.lastMessageAt) > new Date(participant.deletedAt);
  });

  return NextResponse.json(filtered);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, memberIds, isGroup } = await req.json();

  if (!isGroup && memberIds.length === 1) {
    const friendId = memberIds[0];
    const candidates = await prisma.conversation.findMany({
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
    });

    console.log("candidates:", candidates.map((c) => ({
      id: c.id,
      isGroup: c.isGroup,
      participantCount: c.participants.length,
      participantIds: c.participants.map((p) => p.userId),
    })));

    const existing = candidates.find((c) => {
      const participantIds = c.participants.map((p) => p.userId);
      const match = (
        participantIds.length === 2 &&
        participantIds.includes(session.user.id) &&
        participantIds.includes(friendId)
      );
      console.log(`conv ${c.id}: length=${participantIds.length}, isGroup=${c.isGroup}, match=${match}`);
      return match;
    });

    if (existing) {
      // If they had previously cleared this conversation, reset deletedAt so it reappears
      await prisma.conversationParticipant.updateMany({
        where: { conversationId: existing.id, userId: session.user.id },
        data: { deletedAt: null },
      });
      return NextResponse.json(existing);
    }
  }

  if (isGroup) {
    const allMemberIds = [...new Set([session.user.id, ...memberIds])] as string[];
    const existingGroups = await prisma.conversation.findMany({
      where: {
        isGroup: true,
        participants: { some: { userId: session.user.id } },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, fname: true, lname: true, pfp: true } },
          },
        },
      },
    });

    const duplicate = existingGroups.find((g) => {
      const existingIds = g.participants.map((p) => p.userId).sort();
      const newIds = [...allMemberIds].sort();
      return (
        existingIds.length === newIds.length &&
        existingIds.every((id, i) => id === newIds[i])
      );
    });

    if (duplicate) return NextResponse.json(duplicate);
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