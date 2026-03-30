/**
 * Check-in API
 * GET: returns overdue/incomplete tasks from schedule logs.
 * POST: processes task check-ins (completed / partial / missed),
 * updates task state, and returns tasks needing rescheduling.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Returns overdue or incomplete tasks derived from schedule logs
 * where the scheduled date is before today.
 *
 * @returns {Promise<NextResponse>} JSON response with tasks array
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const userId = session.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const logs = await (prisma.scheduleLog as any).findMany({
      where: { userId },
      orderBy: { scheduledAt: "desc" },
    });

    const pastTaskIds = new Set<string>();
    for (const log of logs) {
      const days: string[] = Array.isArray(log.days) ? log.days : [];
      for (const dayStr of days) {
        const day = new Date(dayStr + "T12:00:00");
        if (day < today) {
          for (const tid of log.taskIds as string[]) pastTaskIds.add(tid);
        }
      }
    }

    if (pastTaskIds.size === 0) return NextResponse.json({ tasks: [] });

    const tasks = await prisma.task.findMany({
      where: {
        id: { in: Array.from(pastTaskIds) },
        userId,
        completed: false,
        scheduledDate: { lt: today },
      },
      include: { event: { select: { title: true } } },
      orderBy: { scheduledDate: "asc" },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("GET /api/checkin error:", error);
    return NextResponse.json({ tasks: [] });
  }
}

/**
 * Processes task check-in entries and updates task state based on status.
 *
 * @param {NextRequest} req - Request containing { entries: { taskId, status, progress }[] }
 * @returns {Promise<NextResponse>} JSON response with tasksToReschedule array
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const entries: Array<{
    taskId: string;
    status: "completed" | "partial" | "missed";
    progress: number; // 0–100
  }> = body.entries || [];

  if (entries.length === 0) {
    return NextResponse.json({ error: "entries required" }, { status: 400 });
  }

  const userId = session.user.id;
  const now = new Date();

  // Fetch all tasks in one query
  const taskIds = entries.map((e) => e.taskId);
  const dbTasks = await prisma.task.findMany({
    where: { id: { in: taskIds }, userId },
  });
  const taskMap = new Map(dbTasks.map((t) => [t.id, t]));

  const needsReschedule: Array<{ task: any; remainingDuration: number }> = [];

  await Promise.all(
    entries.map(async ({ taskId, status, progress }) => {
      const task = taskMap.get(taskId);
      if (!task) return;

      const updateData: Record<string, unknown> = {
        scheduledDate: null,
        scheduledTime: null,
      };

      if (status === "completed") {
        updateData.completed = true;
        updateData.completedAt = now;
        updateData.status = "completed";
        updateData.progress = null; // clear progress on completion
      } else {
        updateData.missedAt = now;
        updateData.status = "todo";

        const originalDuration = task.duration || 60;
        const pct =
          status === "partial" ? Math.max(0, Math.min(progress, 100)) : 0;
        const remainingMins = Math.round(originalDuration * (1 - pct / 100));

        // Persist progress so TaskCard/TaskViewDialog can show it 
        updateData.progress = status === "partial" ? pct : 0;

        needsReschedule.push({
          task: { ...task, duration: originalDuration },
          remainingDuration: Math.max(remainingMins, 5),
        });
      }

      try {
        await prisma.task.update({
          where: { id: taskId, userId },
          data: updateData as Parameters<typeof prisma.task.update>[0]["data"],
        });
      } catch (e) {
        console.error(`Failed to update task ${taskId}:`, e);
        // Minimal fallback — at least clear the scheduled slot
        await prisma.task.update({
          where: { id: taskId, userId },
          data: {
            completed: status === "completed",
            completedAt: status === "completed" ? now : null,
            status: status === "completed" ? "completed" : "todo",
            scheduledDate: null,
            scheduledTime: null,
          } as Parameters<typeof prisma.task.update>[0]["data"],
        });
      }
    }),
  );

  // Persist check-in record (non-fatal if model doesn't exist yet)
  try {
    await (prisma as any).checkIn.create({
      data: { userId, date: now, taskEntries: entries },
    });
  } catch {}

  // Return tasks to reschedule with their adjusted remaining durations
  const tasksToReschedule = needsReschedule.map(
    ({ task, remainingDuration }) => ({
      ...task,
      remainingDuration,
      scheduledDate: null,
      scheduledTime: null,
      dueDate: task.dueDate ? (task.dueDate as Date).toISOString() : null,
      completedAt: task.completedAt
        ? (task.completedAt as Date).toISOString()
        : null,
      missedAt: task.missedAt ? (task.missedAt as Date).toISOString() : null,
      createdAt: task.createdAt ? (task.createdAt as Date).toISOString() : null,
      updatedAt: task.updatedAt ? (task.updatedAt as Date).toISOString() : null,
    }),
  );

  return NextResponse.json({ tasksToReschedule });
}
