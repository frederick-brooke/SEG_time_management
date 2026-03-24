import { prisma } from "@/lib/prisma";

// XP & coin rewards per priority
const PRIORITY_REWARDS: Record<string, { xp: number; coins: number }> = {
  Low:    { xp: 10,  coins: 5  },
  Medium: { xp: 20,  coins: 10 },
  High:   { xp: 30,  coins: 15 },
};

function getLevelFromXp(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export async function awardTaskPoints(
  userId: string,
  taskId: string,
  priority: string
) {
  const reward = PRIORITY_REWARDS[priority] ?? PRIORITY_REWARDS.Low;

  const progress = await prisma.userProgress.findUnique({
    where: { userId },
  });
  if (!progress) return;

  // Check XP boost
  const xpMultiplier =
    progress.xpBoostExpires && new Date(progress.xpBoostExpires) > new Date()
      ? 2
      : 1;

  const xpGain    = reward.xp * xpMultiplier;
  const coinGain  = reward.coins;
  const newXp     = progress.experience + xpGain;
  const newLevel  = getLevelFromXp(newXp);

  await prisma.userProgress.update({
    where: { userId },
    data: {
      experience: { increment: xpGain },
      coins:      (progress.coins ?? 0) + coinGain,
      level:      newLevel,
    },
  });

  await prisma.pointTransaction.create({
    data: {
      progressId: progress.id,
      amount:     coinGain,
      reason:     `Task completed (${priority}) — +${xpGain} XP, +${coinGain} coins`,
      taskId,
    },
  });
}

export async function revokeTaskPoints(
  userId: string,
  taskId: string,
  priority: string
) {
  const reward = PRIORITY_REWARDS[priority] ?? PRIORITY_REWARDS.Low;

  const progress = await prisma.userProgress.findUnique({
    where: { userId },
  });
  if (!progress) return;

  const newXp    = Math.max(0, progress.experience - reward.xp);
  const newLevel = getLevelFromXp(newXp);

  await prisma.userProgress.update({
    where: { userId },
    data: {
      experience: { decrement: reward.xp },
      coins: Math.max(0, (progress.coins ?? 0) - reward.coins),
      level:      newLevel,
    },
  });

  await prisma.pointTransaction.create({
    data: {
      progressId: progress.id,
      amount:     -reward.coins,
      reason:     `Task un-completed (${priority}) — -${reward.xp} XP, -${reward.coins} coins`,
      taskId,
    },
  });
}

export async function consumeStreakShield(userId: string): Promise<boolean> {
  const progress = await prisma.userProgress.findUnique({ where: { userId } });
  if (!progress || progress.streakShields <= 0) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (
    progress.shieldUsedDate &&
    new Date(progress.shieldUsedDate) >= today
  ) {
    return false;
  }

  await prisma.userProgress.update({
    where: { userId },
    data: {
      streakShields: { decrement: 1 },
      shieldUsedDate: new Date(),
    },
  });
  return true;
}