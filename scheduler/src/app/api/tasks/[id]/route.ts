import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";
import { awardTaskPoints, revokeTaskPoints } from "@/src/lib/points";

// Delete task
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}

// Patch (update) task
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Fetch the current task so we know its previous state + owner
    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const wasCompleted = existingTask.completed;

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.dueDate !== undefined) updateData.dueDate = new Date(body.dueDate);
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.subtasks !== undefined) updateData.subtasks = body.subtasks;
    if (body.url !== undefined) updateData.url = body.url;

    // Handle status updates and sync with completed field
    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === "completed") {
        updateData.completed = true;
        updateData.completedAt = new Date();
      } else {
        updateData.completed = false;
        updateData.completedAt = null;
      }
    }

    // Handle direct completed toggles
    if (body.completed !== undefined) {
      updateData.completed = body.completed;
      updateData.completedAt = body.completed ? new Date() : null;
      updateData.status = body.completed ? "completed" : "todo";
    }

    const task = await prisma.task.update({ where: { id }, data: updateData });

    // ── POINTS LOGIC ──────────────────────────────────────────────
    const isNowCompleted = task.completed;
    const priority = task.priority ?? "Low";

    if (!wasCompleted && isNowCompleted) {
      // Task was just completed → award points
      await awardTaskPoints(task.userId, task.id, priority);
    } else if (wasCompleted && !isNowCompleted) {
      // Task was un-completed → revoke points
      await revokeTaskPoints(task.userId, task.id, priority);
    }
    // ──────────────────────────────────────────────────────────────

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}