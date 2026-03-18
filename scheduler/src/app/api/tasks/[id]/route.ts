import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE task error:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const d: Record<string, unknown> = {};

    if (body.title !== undefined) d.title = body.title;
    if (body.description !== undefined)
      d.description = body.description ?? null;
    if (body.dueDate !== undefined)
      d.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.priority !== undefined) d.priority = body.priority;
    if (body.duration !== undefined) d.duration = Number(body.duration);
    if (body.subtasks !== undefined) d.subtasks = body.subtasks;
    if (body.bufferDays !== undefined) d.bufferDays = body.bufferDays ?? null;
    if (body.url !== undefined) d.url = body.url ?? null;
    if (body.isRecurring !== undefined) d.isRecurring = body.isRecurring;
    if (body.recurrence !== undefined) d.recurrence = body.recurrence ?? null;
    if (body.missedAt !== undefined)
      d.missedAt = body.missedAt ? new Date(body.missedAt) : null;
    if (body.carriedFrom !== undefined)
      d.carriedFrom = body.carriedFrom ?? null;
    if (body.examId !== undefined)
      if (body.examId && body.examId !== "none") {
        const linkedExam = await prisma.exam.findUnique({ where: { id: body.examId }});
        d.category = linkedExam?.title || "General";
        d.examId = body.examId;
      } else {
        d.category = "General";
        d.examId = null;
      }
    if (body.eventId !== undefined) d.eventId = body.eventId || null;
    if (body.scheduledDate !== undefined)
      d.scheduledDate = body.scheduledDate
        ? new Date(body.scheduledDate)
        : null;
    if (body.scheduledTime !== undefined)
      d.scheduledTime = body.scheduledTime
        ? new Date(body.scheduledTime)
        : null;

    // ── progress field (from check-in partial completion) ────────────────────
    if (body.progress !== undefined) d.progress = body.progress ?? null;

    if (body.status !== undefined) {
      d.status = body.status;
      d.completed = body.status === "completed";
      d.completedAt = body.status === "completed" ? new Date() : null;
      // Clear progress when task is completed
      if (body.status === "completed") d.progress = null;
    }

    if (body.completed !== undefined) {
      updateData.completed = body.completed;
      updateData.completedAt = body.completed ? new Date() : null;
      updateData.status = body.completed ? "completed" : "todo";
    }

    const task = await prisma.task.update({ where: { id }, data: updateData });

    const isNowCompleted = task.completed;
const priority = task.priority ?? "Low";

const PRIORITY_REWARDS: Record<string, { xp: number; coins: number }> = {
  Low:    { xp: 10, coins: 5  },
  Medium: { xp: 20, coins: 10 },
  High:   { xp: 30, coins: 15 },
};

let rewards: { xp: number; coins: number } | null = null;

if (!wasCompleted && isNowCompleted) {
  await awardTaskPoints(task.userId, task.id, priority);
  rewards = PRIORITY_REWARDS[priority] ?? PRIORITY_REWARDS.Low;
} else if (wasCompleted && !isNowCompleted) {
  await revokeTaskPoints(task.userId, task.id, priority);
}

    return NextResponse.json({ task, rewards });

  } catch (error) {
    console.error("PATCH task error:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}
