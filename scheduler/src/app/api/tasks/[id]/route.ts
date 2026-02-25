import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

// Delete task
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await prisma.task.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}

// patch (update) task
// [id]/route.ts
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const currentTask = await prisma.task.findUnique({
      where: { id },
      select: { completed: true, userId: true, priority: true }
    });

    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // IMPORTANT: Check if we are moving from incomplete -> complete
    const isCompleting = body.completed === true && currentTask.completed === false;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the Task
      const updatedTask = await tx.task.update({
        where: { id },
        data: body,
      });

      let xpGained = 0;

      if (isCompleting) {
        // Match points to your priority field
        const pointsMap = { High: 50, Medium: 25, Low: 10 };
        xpGained = pointsMap[currentTask.priority] || 10;

        // 2. Update User (The fields match your schema: points, level, experience)
        await tx.user.update({
          where: { id: currentTask.userId }, // Prisma handles the ObjectId conversion if this is the correct ID
          data: {
            points: { increment: xpGained },
            experience: { increment: xpGained },
            // Optional: Dynamic leveling logic (1 level per 100 XP)
            // level: Math.floor((newPoints) / 100) + 1
          }
        });

        // 3. Log the transaction (matches your PointTransaction model)
        await tx.pointTransaction.create({
          data: {
            userId: currentTask.userId,
            amount: xpGained,
            reason: "TASK_COMPLETED",
            taskId: id
          }
        });
      }

      return { updatedTask, xpGained };
    });

    return NextResponse.json({ success: true, xpGained: result.xpGained });
  } catch (error) {
    console.error("XP Update Error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
