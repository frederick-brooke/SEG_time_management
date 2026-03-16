import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

/**
 * GET /api/conversations/[conversationId]/messages
 * Returns the 20 most recent messages in a conversation, newest first.
 * Supports cursor-based pagination via the `cursor` query param.
 * Messages sent before the user cleared their history are excluded.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await params;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");

  // Check if this user has cleared their history for this conversation
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId: session.user.id },
  });

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      // Only show messages sent after the user cleared their history
      ...(participant?.deletedAt && {
        createdAt: { gt: participant.deletedAt },
      }),
    },
    take: 20,
    ...(cursor && {
      // skip: 1 excludes the cursor message itself from the next page
      skip: 1,
      cursor: { id: cursor },
    }),
    orderBy: { createdAt: "desc" },
    include: {
      sender: {
        select: { id: true, username: true, pfp: true },
      },
    },
  });

  return NextResponse.json(messages);
}