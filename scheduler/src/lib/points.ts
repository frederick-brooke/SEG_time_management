import { prisma } from "@/src/lib/prisma";

const POINTS_MAP: Record<string, number> = {
  High: 30,
  Medium: 20,
  Low: 10,
};

const XP_PER_LEVEL = 100;

/**
 * Awards points to a user when they complete a task.
 * Creates/updates UserProgress and logs a PointTransaction.
 * Also recalculates level based on total points.
 */
export async function awardTaskPoints(userId: string, taskId: string, priority: string) {
  const points = POINTS_MAP[priority] ?? 10;

  // Upsert UserProgress (create if it doesn't exist yet)
  const progress = await prisma.userProgress.upsert({
    where: { userId },
    create: {
      userId,
      points,
      experience: points,
      level: 1,
      streak: 0,
    },
    update: {
      points: { increment: points },
      experience: { increment: points },
    },
  });

  // Recalculate level from total points
  const newLevel = Math.floor(progress.points / XP_PER_LEVEL) + 1;
  if (newLevel !== progress.level) {
    await prisma.userProgress.update({
      where: { userId },
      data: { level: newLevel },
    });
  }

  // Log the transaction
  await prisma.pointTransaction.create({
    data: {
      progressId: progress.id,
      amount: points,
      reason: `Completed task (${priority} priority)`,
      taskId,
    },
  });

  return { points, newLevel };
}

/**
 * Removes points from a user when a completed task is un-completed.
 */
export async function revokeTaskPoints(userId: string, taskId: string, priority: string) {
  const points = POINTS_MAP[priority] ?? 10;

  const progress = await prisma.userProgress.findUnique({ where: { userId } });
  if (!progress) return;

  const newPoints = Math.max(0, progress.points - points);
  const newXp = Math.max(0, progress.experience - points);
  const newLevel = Math.floor(newPoints / XP_PER_LEVEL) + 1;

  await prisma.userProgress.update({
    where: { userId },
    data: {
      points: newPoints,
      experience: newXp,
      level: newLevel,
    },
  });

  // Log the reversal
  await prisma.pointTransaction.create({
    data: {
      progressId: progress.id,
      amount: -points,
      reason: `Task un-completed (${priority} priority)`,
      taskId,
    },
  });
}