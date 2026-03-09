import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";
import { scheduleTasks } from "@/src/lib/scheduler";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { taskIds, days } = await req.json();
  if (!taskIds?.length || !days?.length) {
    return NextResponse.json(
      { error: "taskIds and days required" },
      { status: 400 },
    );
  }

  const tasks = await prisma.task.findMany({
    where: { id: { in: taskIds }, userId: session.user.id },
  });

  const preferences = await prisma.userPreferences.findUnique({
    where: { userId: session.user.id },
  });

  if (!preferences) {
    return NextResponse.json(
      { error: "User preferences not found" },
      { status: 400 },
    );
  }

  const startOfRange = new Date(days[0]);
  startOfRange.setHours(0, 0, 0, 0);
  const endOfRange = new Date(days[days.length - 1]);
  endOfRange.setHours(23, 59, 59, 999);

  const events = await prisma.event.findMany({
    where: {
      userId: session.user.id,
      start: { gte: startOfRange, lte: endOfRange },
    },
  });

  const scheduleDays = days.map((d: string) => new Date(d));

  const scheduled = scheduleTasks(tasks, events, preferences, scheduleDays);

  const warnings = scheduled.filter((s) => s.scheduledDate.getTime() === 0);
  const valid = scheduled.filter((s) => s.scheduledDate.getTime() !== 0);

  await Promise.all(
    valid.map((s) =>
      prisma.task.update({
        where: { id: s.taskId },
        data: {
          scheduledDate: s.scheduledDate,
          scheduledTime: s.scheduledTime,
        },
      }),
    ),
  );
  return NextResponse.json({
    scheduled: valid.length,
    warnings: warnings.map((w) => {
      const task = tasks.find((t) => t.id === w.taskId);
      return { taskId: w.taskId, title: task?.title };
    }),
  });
}
