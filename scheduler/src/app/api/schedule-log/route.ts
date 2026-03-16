import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — fetch all schedule logs for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  try {
    const logs = await (prisma.scheduleLog as any).findMany({
      where: { userId: session.user.id },
      orderBy: { scheduledAt: "desc" },
    });
    return NextResponse.json({ logs });
  } catch (error) {
    // If schema hasn't been migrated yet (e.g. previousSchedule field missing),
    // return empty logs rather than crashing the page
    console.error("Schedule log fetch error:", error);
    return NextResponse.json({ logs: [] });
  }
}

// POST — kept for backward-compat but schedule/route.ts now creates logs itself
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { mode, dateLabel, taskIds, previousSchedule, days } = await req.json();

  const log = await (prisma.scheduleLog as any).create({
    data: {
      userId: session.user.id,
      mode,
      dateLabel,
      taskIds: taskIds || [],
      previousSchedule: previousSchedule || null,
      days: days || null,
    },
  });

  return NextResponse.json({ log });
}

// DELETE — restore each task to its pre-schedule times, then delete the log
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "Log ID required" }, { status: 400 });

  // Fetch the log (verify ownership too)
  const log = await (prisma.scheduleLog as any).findFirst({
    where: { id, userId: session.user.id },
  });

  if (!log)
    return NextResponse.json({ error: "Log not found" }, { status: 404 });

  // Restore each task's previous scheduledDate / scheduledTime
  const snapshot = (log.previousSchedule ?? {}) as Record<
    string,
    { scheduledDate: string | null; scheduledTime: string | null }
  >;

  await Promise.all(
    (log.taskIds as string[]).map((taskId: string) => {
      const prev = snapshot[taskId];
      return prisma.task.update({
        where: { id: taskId },
        data: {
          // If snapshot has a previous time, restore it. Otherwise clear it.
          scheduledDate: prev?.scheduledDate ? new Date(prev.scheduledDate) : null,
          scheduledTime: prev?.scheduledTime ? new Date(prev.scheduledTime) : null,
        } as Parameters<typeof prisma.task.update>[0]["data"],
      });
    }),
  );

  // Delete the log
  await (prisma.scheduleLog as any).delete({ where: { id } });

  return NextResponse.json({ success: true });
}