import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

/**
 * GET /api/conversations
 * Returns all conversations for the current user, ordered by most recent message.
 * Conversations the user has cleared are hidden unless a new message has arrived since.
 * Each conversation is annotated with `hasUnread` and `lastMessageSentByMe`.
 */
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
      // Only fetch the latest message — used for unread detection, not display
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { senderId: true, createdAt: true },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  const filtered = conversations
    .filter((conv) => {
      const participant = conv.participants.find((p) => p.userId === session.user.id);
      // Show the conversation if the user hasn't cleared it, or if a new message
      // has arrived since they cleared it
      if (!participant?.deletedAt) return true;
      return conv.lastMessageAt && new Date(conv.lastMessageAt) > new Date(participant.deletedAt);
    })
    .map((conv) => {
      const participant = conv.participants.find((p) => p.userId === session.user.id);
      const lastMsg = conv.messages[0];
      const lastMessageSentByMe = lastMsg?.senderId === session.user.id;

      // Unread = last message exists, wasn't sent by me, and arrived after I last read
      const hasUnread =
        !!lastMsg &&
        !lastMessageSentByMe &&
        (!participant?.lastReadAt ||
          new Date(lastMsg.createdAt) > new Date(participant.lastReadAt));

      return {
        ...conv,
        lastMessageSentByMe,
        hasUnread,
        messages: undefined, // strip raw messages — callers should use the annotated fields
      };
    });

  return NextResponse.json(filtered);
}

/**
 * POST /api/conversations
 * Creates a new 1-to-1 or group conversation.
 *
 * For 1-to-1: returns the existing conversation if one already exists. If the
 * user had previously cleared it, `deletedAt` is reset so it reappears in their sidebar.
 *
 * For groups: returns the existing group if one with the exact same members already exists.
 * The creator is always added as admin; all other members join as members.
 */
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

    // Match on exactly 2 participants to rule out group conversations containing both users
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
      // Reset deletedAt so the conversation reappears if the user had cleared it
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

    // Prevent duplicate groups with identical member sets
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