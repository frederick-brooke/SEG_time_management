import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

/**
 * GET /api/conversations/[conversationId]
 * Returns a conversation with its participants.
 * Requires the requesting user to be a participant.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;

  // Validate the ID before hitting the database
  if (!conversationId || typeof conversationId !== "string") {
    return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
  }

  // Authenticate the requesting user
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        isGroup: true,
        name: true,
        participants: {
          select: {
            userId: true,
            role: true,
            joinedAt: true,
            user: { select: { id: true, username: true, fname: true, pfp: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Ensure the requesting user is a participant
    const isMember = conversation.participants.some((p) => p.userId === session.user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("[GET /conversations/:id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}