import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

/**
 * Safely parses JSON body from the request.
 * Returns null if parsing fails.
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
 * Finds an existing 1-to-1 conversation between two users.
 */
async function findExistingConversation(userId: string, targetUserId: string) {
  const candidates = await prisma.conversation.findMany({
    where: {
      isGroup: false,
      participants: { some: { userId } },
    },
    include: { participants: true },
  });

  return candidates.find((c) => {
    const ids = c.participants.map((p) => p.userId);
    return ids.length === 2 && ids.includes(userId) && ids.includes(targetUserId);
  });
}

/**
 * Creates a new 1-to-1 conversation between two users.
 */
async function createConversation(userId: string, targetUserId: string) {
  return prisma.conversation.create({
    data: {
      isGroup: false,
      participants: {
        create: [{ userId }, { userId: targetUserId }],
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
}

/**
 * POST /api/conversations
 * Finds or creates a 1-to-1 conversation with the target user.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await parseRequestBody(req);
  if (!body?.targetUserId) {
    return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });
  }

  const { targetUserId } = body;

  const existing = await findExistingConversation(session.user.id, targetUserId);
  if (existing) return NextResponse.json(existing);

  try {
    const conversation = await createConversation(session.user.id, targetUserId);
    return NextResponse.json(conversation);
  } catch (err) {
    console.error("Failed to create conversation", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}