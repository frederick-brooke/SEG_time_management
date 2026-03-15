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
 * POST /api/conversations/[conversationId]/messages
 * Creates a new message, updates the conversation's last message preview,
 * and notifies participants via Pusher.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;
  let body: { content?: string } | null = null;
  try {
    body = await req.json();
  } catch (err) {
    console.error("Failed to parse JSON", err);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.content || !conversationId) {
    return NextResponse.json(
      { error: "Missing content or conversationId" },
      { status: 400 }
    );
  }

  try {
    const message = await prisma.message.create({
      data: {
        content: body.content,
        conversationId,
        senderId: session.user.id,
      },
      include: {
        sender: {
          select: { id: true, username: true, pfp: true },
        },
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: body.content,
        lastMessageAt: new Date(),
      },
    });

    // Message delivery to the open conversation view
    pusher
      .trigger(`conversation-${conversationId}`, "new-message", message)
      .catch((err) => console.error("Pusher error:", err));

    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });

    const conversationUpdate = {
      id: conversationId,
      lastMessage: body.content,
      lastMessageAt: new Date().toISOString(),
      senderId: session.user.id,
    };

    // Update each participant's sidebar with the latest message preview
    await Promise.all(
      participants.map((p) =>
        pusher
          .trigger(`user-${p.userId}`, "conversation-updated", conversationUpdate)
          .catch((err) => console.error("Pusher user-channel error:", err))
      )
    );

    return NextResponse.json(message);
  } catch (err) {
    console.error("Failed to create message", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
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

  if (!participant) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

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

    // Remove the conversation from the user's sidebar
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