/**
 * Task reward system
 *
 * Handles XP and coin rewards for completing or revoking tasks,
 * including level calculation and transaction logging.
 */

import { prisma } from "@/lib/prisma";

const PRIORITY_REWARDS: Record<string, { xp: number; coins: number }> = {
  Low:    { xp: 10, coins: 5  },
  Medium: { xp: 20, coins: 10 },
  High:   { xp: 30, coins: 15 },
};

function getLevelFromXp(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

function getReward(priority: string) {
  return PRIORITY_REWARDS[priority] ?? PRIORITY_REWARDS.Low;
}

async function fetchProgress(userId: string) {
  return prisma.userProgress.findUnique({ where: { userId } });
}

function buildTransactionReason(
  action: "completed" | "un-completed",
  priority: string,
  xp: number,
  coins: number
): string {
  const sign = action === "completed" ? "+" : "-";
  return `Task ${action} (${priority}) — ${sign}${xp} XP, ${sign}${coins} coins`;
}

async function updateProgress(
  userId: string,
  experienceDelta: { increment: number } | { decrement: number },
  newCoins: number,
  newLevel: number
) {
  await prisma.userProgress.update({
    where: { userId },
    data: { experience: experienceDelta, coins: newCoins, level: newLevel },
  });
}

async function recordTransaction(
  progressId: string,
  taskId: string,
  amount: number,
  reason: string
) {
  await prisma.pointTransaction.create({
    data: { progressId, taskId, amount, reason },
  });
}

export async function awardTaskPoints(
  userId: string,
  taskId: string,
  priority: string
): Promise<void> {
  const progress = await fetchProgress(userId);
  if (!progress) return;

  const reward   = getReward(priority);
  const newCoins = (progress.coins ?? 0) + reward.coins;
  const newLevel = getLevelFromXp(progress.experience + reward.xp);
  const reason   = buildTransactionReason("completed", priority, reward.xp, reward.coins);

  await updateProgress(userId, { increment: reward.xp }, newCoins, newLevel);
  await recordTransaction(progress.id, taskId, reward.coins, reason);
}

export async function revokeTaskPoints(
  userId: string,
  taskId: string,
  priority: string
): Promise<void> {
  const progress = await fetchProgress(userId);
  if (!progress) return;

  const reward   = getReward(priority);
  const newCoins = Math.max(0, (progress.coins ?? 0) - reward.coins);
  const newLevel = getLevelFromXp(Math.max(0, progress.experience - reward.xp));
  const reason   = buildTransactionReason("un-completed", priority, reward.xp, reward.coins);

  await updateProgress(userId, { decrement: reward.xp }, newCoins, newLevel);
  await recordTransaction(progress.id, taskId, -reward.coins, reason);
}