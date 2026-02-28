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


pusher.trigger(
  `conversation-${conversationId}`,
  "new-message",
  message
).catch(err => console.error("Pusher error:", err));

return NextResponse.json(message);
  } catch (err) {
    console.error("Failed to create message", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}