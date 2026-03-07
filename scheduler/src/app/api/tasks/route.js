import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const tasks = await prisma.task.findMany({
      where: { userId },
      include: { exam: true, event: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Bulk creation for linked tasks
    if (body.tasks && Array.isArray(body.tasks)) {
      const created = await Promise.all(
        body.tasks.map(async (t) => {
          let scheduledDate = null;

          if (t.eventId && t.offsetDays !== undefined) {
            const event = await prisma.event.findUnique({
              where: { id: t.eventId },
              select: { start: true },
            });
            if (event?.start) {
              const d = new Date(event.start);
              d.setDate(d.getDate() + parseInt(t.offsetDays));
              scheduledDate = d;
            }
          }

          return prisma.task.create({
            data: {
              title: t.title,
              userId: t.userId,
              eventId: t.eventId || null,
              duration: t.duration || 60,
              priority: t.priority || "Medium",
              isRecurring: t.isRecurring || false,
              recurrence: t.recurrence || null,
              scheduledDate: scheduledDate,
              status: "todo",
              completed: false,
              subtasks: [],
            },
          });
        }),
      );
      return NextResponse.json({ tasks: created });
    }

    // Single task creation
    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        userId: body.userId,
        completed: false,
        completedAt: null,
        priority: body.priority || "Low",
        duration: body.duration || 0,
        subtasks: body.subtasks || [],
        examId: body.examId && body.examId !== "none" ? body.examId : null,
        eventId: body.eventId || null,
        isRecurring: body.isRecurring || false,
        recurrence: body.recurrence || null,
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
      },
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Task creation error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}
