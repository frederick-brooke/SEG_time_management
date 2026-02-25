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
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 1. Fetch current task state to see if it's already completed
    const currentTask = await prisma.task.findUnique({
      where: { id },
      select: { completed: true, userId: true, priority: true }
    });

    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 2. Identify if this specific update is "completing" the task
    const isCompleting = body.completed === true && currentTask.completed === false;

    // 3. Define Point Logic based on Priority
    const priorityPoints = {
      Low: 10,
      Medium: 25,
      High: 50
    };
    const pointsToAdd = priorityPoints[currentTask.priority] || 10;

    // 4. Use a Transaction to update Task, User Points, and create a Log
    const result = await prisma.$transaction(async (tx) => {
      // Update the Task
      const updatedTask = await tx.task.update({
        where: { id },
        data: body, // Applies your title, description, completed, etc.
      });

      let xpGained = 0;

      // Only reward points if the user just finished the task
      if (isCompleting) {
        xpGained = pointsToAdd;

        // Update User's total points/XP
        await tx.user.update({
          where: { id: currentTask.userId },
          data: {
            points: { increment: xpGained },
            experience: { increment: xpGained }
          }
        });

        // Create a history record (optional but highly recommended)
        await tx.pointTransaction.create({
          data: {
            userId: currentTask.userId,
            amount: xpGained,
            reason: `Completed task: ${updatedTask.title}`,
            taskId: updatedTask.id
          }
        });
      }

      return { updatedTask, xpGained };
    });

    return NextResponse.json({ 
      task: result.updatedTask, 
      xpGained: result.xpGained 
    });

  } catch (error) {
    console.error("PATCH ERROR:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
