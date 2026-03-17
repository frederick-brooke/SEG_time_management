import { NextRequest, NextResponse } from "next/server";
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
 * Sends a typing event to Pusher for a conversation channel.
 * Logs errors but does not block the request.
 */
async function triggerTypingIndicator(
  conversationId: string,
  userId: string,
  username: string,
  isTyping: boolean
) {
  try {
    await pusher.trigger(`conversation-${conversationId}`, "typing", {
      userId,
      username,
      isTyping,
    });
  } catch (err) {
    console.error("Pusher typing error:", err);
  }
}

/**
 * POST /api/conversations/[conversationId]/typing
 * Broadcasts a typing indicator to all participants.
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
  const body = await parseRequestBody(req);
  if (!body || typeof body.isTyping !== "boolean") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Fire-and-forget typing indicator
  triggerTypingIndicator(conversationId, session.user.id, session.user.username, body.isTyping);

  return NextResponse.json({ ok: true });
}