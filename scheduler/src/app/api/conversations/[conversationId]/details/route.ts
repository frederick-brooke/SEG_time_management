import { NextRequest, NextResponse } from "next/server";
import { prisma } from "lib/prisma";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, isGroup: true, name: true },
  });
  return NextResponse.json(conversation);
}