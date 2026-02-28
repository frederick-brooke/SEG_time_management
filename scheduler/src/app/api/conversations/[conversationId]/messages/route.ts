import { NextRequest, NextResponse } from "next/server";
import { prisma } from "lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> } 
) {
  const { conversationId } = await params; 

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");

  const messages = await prisma.message.findMany({
    where: { conversationId },
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