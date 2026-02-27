import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { scheduleTask, scheduleAllTasks } from "@/src/lib/scheduling";


export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const userId = session.user.id;

  try {
    const body = await req.json().catch(() => ({}));

    if (body.taskId) {
      const event = await scheduleTask(body.taskId, userId);
      if (!event) {
        return NextResponse.json(
          { message: "No available time slot found before the deadline." },
          { status: 409 }
        );
      }
      return NextResponse.json({ scheduled: 1, events: [event] });
    }

    const results = await scheduleAllTasks(userId);
    const scheduledCount = results.filter((r) => r.scheduled).length;

    return NextResponse.json({
      scheduled: scheduledCount,
      total: results.length,
      results,
    });
  } catch (err: any) {
    console.error("Scheduling error:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

// Unschedule a task: deletes its "Task" category Event and resets status to "todo".
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");
  if (!taskId)
    return NextResponse.json({ message: "taskId required" }, { status: 400 });

  const { prisma } = await import("@/src/lib/prisma");

  const task = await prisma.task.findFirst({
    where: { id: taskId, userId: session.user.id },
  });
  if (!task)
    return NextResponse.json({ message: "Task not found" }, { status: 404 });

  await prisma.event.deleteMany({
    where: {
      userId: session.user.id,
      title: task.title,
      category: "Task",
    },
  });

  await prisma.task.update({
    where: { id: taskId },
    data: { status: "todo" },
  });

  return NextResponse.json({ success: true });
}