/**
 * @file route.ts
 * @description Handles listing and creating conversations.
 * GET returns all conversations for the current user, annotated with hasUnread
 * and lastMessageSentByMe, filtering out soft-deleted entries.
 * POST finds or creates a conversation — deduplicating both 1-to-1 and group
 * conversations before creating a new one.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

/** 
 * Safely parses JSON request body.
 * Returns null if invalid.
 * */
async function parseRequestBody(req: Request) {
  try { return await req.json(); }
  catch (err) { console.error("Failed to parse JSON", err); return null; }
}

/** 
 * Finds an existing 1-to-1 conversation with a single friend.
 * Returns the conversation object if found, otherwise undefined.
 */
async function find1to1Conversation(userId: string, friendId: string) {
  const candidates = await prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    include: { participants: { include: { user: { select: { id: true } } } } },
  });
  return candidates.find((c) => {
    const ids = c.participants.map((p) => p.userId);
    return ids.length === 2 && ids.includes(userId) && ids.includes(friendId);
  });
}

/** 
 * Finds a duplicate group conversation with the exact same members.
 * Returns the conversation if found, otherwise undefined.
 */
async function findDuplicateGroupConversation(memberIds: string[]) {
  const allIds = [...new Set(memberIds)];
  const existingGroups = await prisma.conversation.findMany({
    where: { isGroup: true, participants: { some: { userId: allIds[0] } } },
    include: { participants: { include: { user: { select: { id: true } } } } },
  });

  return existingGroups.find((g) => {
    const existingIds = g.participants.map((p) => p.userId).sort();
    const newIds = allIds.sort();
    return existingIds.length === newIds.length && existingIds.every((id, i) => id === newIds[i]);
  });
}

/** 
 * Checks for an existing 1-to-1 conversation and undeletes the user if found.
 * Returns the conversation if found, otherwise null.
 */
async function handle1to1Duplicate(userId: string, friendId: string) {
  const existing = await find1to1Conversation(userId, friendId)
  if (!existing) return null
  await prisma.conversationParticipant.updateMany({
    where: { conversationId: existing.id, userId },
    data: { deletedAt: null },
  })
  return existing
}

/** 
 * Checks for an existing group conversation with the same members.
 * Returns the conversation if found, otherwise null.
 */
async function handleGroupDuplicate(memberIds: string[]) {
  return findDuplicateGroupConversation(memberIds)
}

/** 
 * Create a new conversation with the given members.
 * Returns the created conversation with participants included.
*/
async function createConversation(userId: string, memberIds: string[], isGroup: boolean, name?: string) {
  const allMemberIds = [...new Set([userId, ...memberIds])]
  return prisma.conversation.create({
    data: {
      isGroup,
      name: isGroup ? name : null,
      createdById: userId,
      participants: { create: allMemberIds.map(uid => ({ userId: uid, role: uid === userId ? "admin" : "member" })) },
    },
    include: { participants: { include: { user: { select: { id: true, username: true, fname: true, lname: true, pfp: true } } } } },
  })
}


/**
 * GET /api/conversations
 * Returns all conversations for the current user with `hasUnread` and `lastMessageSentByMe`.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const convs = await prisma.conversation.findMany({
    where: { participants: { some: { userId: session.user.id } } },
    include: {
      participants: { include: { user: { select: { id: true, username: true, fname: true, lname: true, pfp: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { senderId: true, createdAt: true } },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  const filtered = convs
    .filter((c) => {
      const p = c.participants.find((p) => p.userId === session.user.id);
      return !p?.deletedAt || (c.lastMessageAt && new Date(c.lastMessageAt) > new Date(p.deletedAt));
    })
    .map((c) => {
      const p = c.participants.find((p) => p.userId === session.user.id);
      const lastMsg = c.messages[0];
      const lastMessageSentByMe = lastMsg?.senderId === session.user.id;
      const hasUnread = !!lastMsg && !lastMessageSentByMe && (!p?.lastReadAt || new Date(lastMsg.createdAt) > new Date(p.lastReadAt));
      return { ...c, lastMessageSentByMe, hasUnread, messages: undefined };
    });

  return NextResponse.json(filtered);
}

/** 
 * POST /api/conversations 
 * Creates a new conversation while avoiding duplicates.
 * Returns the conversation object (existing or newly created).
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await parseRequestBody(req)
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const { name, memberIds, isGroup } = body
  const userId = session.user.id

  if (!isGroup && memberIds.length === 1) {
    const existing = await handle1to1Duplicate(userId, memberIds[0])
    if (existing) return NextResponse.json(existing)
  }

  if (isGroup) {
    const duplicate = await handleGroupDuplicate([...new Set([userId, ...memberIds])])
    if (duplicate) return NextResponse.json(duplicate)
  }

  const conversation = await createConversation(userId, memberIds, !!isGroup, name)
  return NextResponse.json(conversation)
}