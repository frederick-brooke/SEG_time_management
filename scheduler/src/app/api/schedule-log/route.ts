import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const logs = await prisma.scheduleLog.findMany({
    where: { userId: session.user.id },
    orderBy: { scheduledAt: "desc" },
    take: 10,
  });

  return NextResponse.json({ logs });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { mode, dateLabel, taskIds } = await req.json();

  const log = await prisma.scheduleLog.create({
    data: { userId: session.user.id, mode, dateLabel, taskIds },
  });

  return NextResponse.json({ log });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // verify ownership
  const log = await prisma.scheduleLog.findUnique({ where: { id } });
  if (!log || log.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // unschedule all tasks in this log
  await prisma.task.updateMany({
    where: { id: { in: log.taskIds }, userId: session.user.id },
    data: { scheduledDate: null, scheduledTime: null },
  });

  await prisma.scheduleLog.delete({ where: { id } });

  return NextResponse.json({ success: true });
}