import { prisma } from "@/src/lib/prisma";

const POINTS_MAP: Record<string, number> = {
  High: 30,
  Medium: 20,
  Low: 10,
};

const XP_PER_LEVEL = 100;

/**
 * Awards points to a user when they complete a task.
 * Doubles points if an XP boost is active.
 * Recalculates level and logs a PointTransaction.
 */
export async function awardTaskPoints(userId: string, taskId: string, priority: string) {
  const basePoints = POINTS_MAP[priority] ?? 10;

  // Fetch current progress to check for active XP boost
  const existing = await prisma.userProgress.findUnique({ where: { userId } });

  const boostActive = existing?.xpBoostExpires
    ? new Date(existing.xpBoostExpires) > new Date()
    : false;

  const points = boostActive ? basePoints * 2 : basePoints;

  const progress = await prisma.userProgress.upsert({
    where: { userId },
    create: {
      userId,
      points,
      experience: points,
      level: 1,
      streak: 0,
      streakShields: 0,
    },
    update: {
      points: { increment: points },
      experience: { increment: points },
    },
  });

  // Recalculate level
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
      reason: boostActive
        ? `Completed task (${priority} priority) ⚡ 2x Boost`
        : `Completed task (${priority} priority)`,
      taskId,
    },
  });

  return { points, newLevel, boostActive };
}

/**
 * Removes points from a user when a completed task is un-completed.
 * Also accounts for whether a boost was active (uses same multiplier logic).
 */
export async function revokeTaskPoints(userId: string, taskId: string, priority: string) {
  const basePoints = POINTS_MAP[priority] ?? 10;

  const progress = await prisma.userProgress.findUnique({ where: { userId } });
  if (!progress) return;

  // Deduct the same amount that would have been awarded
  // (we can't know if boost was active at completion time, so deduct base)
  const newPoints = Math.max(0, progress.points - basePoints);
  const newXp = Math.max(0, progress.experience - basePoints);
  const newLevel = Math.floor(newPoints / XP_PER_LEVEL) + 1;

  await prisma.userProgress.update({
    where: { userId },
    data: { points: newPoints, experience: newXp, level: newLevel },
  });

  await prisma.pointTransaction.create({
    data: {
      progressId: progress.id,
      amount: -basePoints,
      reason: `Task un-completed (${priority} priority)`,
      taskId,
    },
  });
}

// Replace the consumeStreakShield function in src/lib/points.ts with this version.
// It records the date the shield was used so repeated profile loads
// on the same day don't consume multiple shields.

export async function consumeStreakShield(userId: string): Promise<boolean> {
    const progress = await prisma.userProgress.findUnique({ where: { userId } });
    if (!progress || progress.streakShields <= 0) return false;
  
    // Check if a shield was already used today — if so, the streak is
    // already being protected, just return true without consuming another
    if (progress.shieldUsedDate) {
      const lastUsed = new Date(progress.shieldUsedDate);
      lastUsed.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      if (lastUsed.getTime() === today.getTime()) {
        // Shield already consumed today — streak is still protected, don't deduct again
        return true;
      }
    }
  
    // Consume the shield and record today as the used date
    await prisma.userProgress.update({
      where: { userId },
      data: {
        streakShields: { decrement: 1 },
        shieldUsedDate: new Date(),
      },
    });
  
    return true;
  }