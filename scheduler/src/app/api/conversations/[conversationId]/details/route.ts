/**
 * @file route.ts
 * @description GET handler for retrieving a single conversation by ID.
 * Validates the request, checks participant membership, and returns
 * the conversation with its participants and user details.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

type Params = { params: Promise<{ conversationId: string }> };

/**
 * Fetches a conversation by ID, including participants and their user details.
 */
async function fetchConversation(conversationId: string) {
  return prisma.conversation.findUnique({
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
}

/**
 * Validates the conversation ID format and checks the user is authenticated.
 * Returns an error response if either check fails, otherwise null.
 */
function validateRequest(conversationId: unknown, userId: string | undefined) {
  // Validate the ID before hitting the database
  if (!conversationId || typeof conversationId !== "string") {
    return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
  }
  // Authenticate the requesting user
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * Checks that the conversation exists and the given user is a participant.
 * Returns an error response if either check fails, otherwise null.
 */
function authorizeParticipant(
  conversation: Awaited<ReturnType<typeof fetchConversation>>,
  userId: string
) {
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }
  // Ensure the requesting user is a participant
  const isMember = conversation.participants.some((p) => p.userId === userId);
  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}


/**
 * GET /api/conversations/[conversationId]
 * Returns a conversation with its participants.
 * Requires the requesting user to be a participant.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const { conversationId } = await params;
  const session = await getServerSession(authOptions);

  const validationError = validateRequest(conversationId, session?.user?.id);
  if (validationError) return validationError;

  try {
    const conversation = await fetchConversation(conversationId);
    const authError = authorizeParticipant(conversation, session!.user!.id);
    if (authError) return authError;

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("[GET /conversations/:id]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}