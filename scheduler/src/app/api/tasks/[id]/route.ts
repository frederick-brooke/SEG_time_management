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

// Points per level threshold - 100 XP per level
const XP_PER_LEVEL = 100;

/**
 * Calculates the new level based on total experience points
 */
function calculateLevel(totalExperience: number): number {
  return Math.floor(totalExperience / XP_PER_LEVEL) + 1;
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    console.log("=== PATCH CALLED ===");
    console.log("Task ID:", id);
    console.log("Body received:", JSON.stringify(body));

    const currentTask = await prisma.task.findUnique({
      where: { id },
      select: { completed: true, userId: true, priority: true, title: true }
    });

    console.log("Current task:", JSON.stringify(currentTask));
    console.log("body.completed:", body.completed, "| currentTask.completed:", currentTask?.completed);
    console.log("isCompleting would be:", body.completed === true && currentTask?.completed === false);

    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 2. Only award points if task is going from incomplete → complete
    const isCompleting = body.completed === true && currentTask.completed === false;

    // 3. Points map based on priority
    const pointsMap: Record<string, number> = { High: 50, Medium: 25, Low: 10 };
    const xpGained = pointsMap[currentTask.priority] ?? 10;

    // 4. Run everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the task itself
      const updatedTask = await tx.task.update({
        where: { id },
        data: body,
      });

      if (isCompleting) {
        // Fetch the user's current experience BEFORE incrementing
        const user = await tx.user.findUnique({
          where: { id: currentTask.userId },
          select: { experience: true, points: true, level: true }
        });

        if (!user) throw new Error(`User ${currentTask.userId} not found`);

        const newExperience = user.experience + xpGained;
        const newLevel = calculateLevel(newExperience);

        console.log(`>>> Awarding ${xpGained} XP to user ${currentTask.userId}`);
        console.log(`>>> XP: ${user.experience} → ${newExperience} | Level: ${user.level} → ${newLevel}`);

        // Update user: points, experience, AND level
        await tx.user.update({
          where: { id: currentTask.userId },
          data: {
            points:     { increment: xpGained },
            experience: { increment: xpGained },
            level:      newLevel,   // ← set directly, not incremented
          }
        });

        // Record the transaction
        await tx.pointTransaction.create({
          data: {
            userId: currentTask.userId,
            amount: xpGained,
            reason: `TASK_COMPLETED: ${currentTask.title}`,
            taskId: id,
          }
        });
      }

      return updatedTask;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("PATCH ERROR:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}