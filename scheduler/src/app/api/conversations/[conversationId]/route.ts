/**
 * @file route.ts
 * @description Handles message operations within a conversation.
 * POST creates and broadcasts a new message via Pusher.
 * DELETE soft-clears history for the requesting user only (sets deletedAt).
 * PATCH marks the conversation as read by updating lastReadAt.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

/**
 * Sends a message to Pusher for a given channel and event.
 * Logs errors but does not throw.
 * @param channel - The Pusher channel name
 * @param event - The Pusher event name
 * @param data - The data payload
 */
async function triggerPusher(channel: string, event: string, data: Record<string, unknown>) {
  try {
    await pusher.trigger(channel, event, data);
  } catch (err) {
    console.error(`Pusher error on channel ${channel}:`, err);
  }
}

/**
 * Updates the conversation's last message and timestamp.
 * @param conversationId - The conversation to update
 * @param lastMessage - The content of the last message
 */
async function updateConversation(conversationId: string, lastMessage: string) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessage,
      lastMessageAt: new Date(),
    },
  });
}

/**
 * Notifies all conversation participants (sidebar updates) about the latest message.
 * @param conversationId - The conversation ID
 * @param senderId - The ID of the message sender
 * @param lastMessage - The content of the last message
 */
async function notifyParticipants(
  conversationId: string,
  senderId: string,
  lastMessage: string
) {
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { userId: true },
  });

  const conversationUpdate = {
    id: conversationId,
    lastMessage,
    lastMessageAt: new Date().toISOString(),
    senderId,
  };

  await Promise.all(
    participants.map((p) =>
      triggerPusher(`user-${p.userId}`, "conversation-updated", conversationUpdate)
    )
  );
}

/**
 * Creates a new message in the database including the sender info.
 * @param conversationId - The conversation ID
 * @param senderId - The ID of the sender
 * @param content - The message content
 */
async function createMessage(
  conversationId: string,
  senderId: string,
  content: string
) {
  return prisma.message.create({
    data: { conversationId, senderId, content },
    include: {
      sender: { select: { id: true, username: true, pfp: true } },
    },
  });
}

/**
 * Main handler for creating a message in a conversation.
 * 
 * Pusher behaviour:
 * - The 'new message' event is triggers fire-and-forget to avoid blocking the request
 * - The 'conversation updated' notifications are awaited because they must reliably reach all
 *   participants for sidebar synchronization.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = await params;
  const body = await parseRequestBody(req);
  if (!body?.content || !conversationId) {
    return NextResponse.json(
      { error: "Missing content or conversationId" },
      { status: 400 }
    );
  }

  try {
    // Create message and update conversation
    const message = await createMessage(conversationId, session.user.id, body.content);
    await updateConversation(conversationId, body.content);

    // Notify Pusher channels
    triggerPusher(`conversation-${conversationId}`, "new-message", message);
    await notifyParticipants(conversationId, session.user.id, body.content);

    return NextResponse.json(message);
  } catch (err) {
    console.error("Failed to create message", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * Safely parses the request JSON.
 * Returns null if invalid.
 */
async function parseRequestBody(req: NextRequest) {
  try {
    return await req.json();
  } catch (err) {
    console.error("Failed to parse JSON", err);
    return null;
  }
}

/**
 * DELETE /api/conversations/[conversationId]/messages
 * Clears the conversation history for the current user by setting `deletedAt`.
 * Does not delete messages globally — other participants are unaffected.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;

  const participant = await prisma.conversationParticipant.findFirst({
    where: {
      conversationId,
      userId: session.user.id,
    },
  });

  if (!participant) { return NextResponse.json({ error: "Conversation not found" }, { status: 404 }); }

  try {
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId: session.user.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    await pusher
      .trigger(`user-${session.user.id}`, "conversation-deleted", { id: conversationId })
      .catch((err) => console.error("Pusher delete error:", err));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to clear conversation", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/conversations/[conversationId]/messages
 * Marks the conversation as read for the current user by updating `lastReadAt`.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = await params;

  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: session.user.id },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json({ success: true });
}