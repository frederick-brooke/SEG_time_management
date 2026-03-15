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
 * POST /api/conversations/[conversationId]/typing
 * Broadcasts a typing indicator to all participants in the conversation.
 * The Pusher trigger doesn't wait before responding.
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
  const { isTyping } = await req.json();

  pusher
    .trigger(`conversation-${conversationId}`, "typing", {
      userId: session.user.id,
      username: session.user.username,
      isTyping,
    })
    .catch((err) => console.error("Pusher typing error:", err));

  return NextResponse.json({ ok: true });
}