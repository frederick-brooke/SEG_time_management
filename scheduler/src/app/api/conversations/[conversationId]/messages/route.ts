import { NextRequest, NextResponse } from "next/server";
import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";

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