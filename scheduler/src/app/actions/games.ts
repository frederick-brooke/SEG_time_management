'use server'

import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";
import { DIFFICULTY_CONFIG, Difficulty } from "@/src/lib/games-config";

export async function payGameEntry(difficulty: Difficulty) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const cost = DIFFICULTY_CONFIG[difficulty].cost;

  const progress = await prisma.userProgress.findUnique({
    where: { userId: session.user.id },
  });

  if (!progress) throw new Error("No progress record found");
  if (progress.points < cost) throw new Error("Not enough points");

  await prisma.userProgress.update({
    where: { userId: session.user.id },
    data: { points: { decrement: cost } },
  });

  await prisma.pointTransaction.create({
    data: {
      progressId: progress.id,
      amount: -cost,
      reason: `Orbit Puzzle entry (${difficulty})`,
    },
  });

  return { success: true, newBalance: progress.points - cost };
}

export async function claimGameWin(difficulty: Difficulty, timeRemaining: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const config = DIFFICULTY_CONFIG[difficulty];
  const speedBonus = Math.floor((timeRemaining / config.timeLimit) * config.winPayout * 0.2);
  const totalPayout = config.winPayout + speedBonus;

  const progress = await prisma.userProgress.findUnique({
    where: { userId: session.user.id },
  });
  if (!progress) throw new Error("No progress record found");

  const newPoints = progress.points + totalPayout;
  const XP_PER_LEVEL = 100;
  const newLevel = Math.floor(newPoints / XP_PER_LEVEL) + 1;

  await prisma.userProgress.update({
    where: { userId: session.user.id },
    data: {
      points: { increment: totalPayout },
      experience: { increment: totalPayout },
      level: newLevel,
    },
  });

  await prisma.pointTransaction.create({
    data: {
      progressId: progress.id,
      amount: totalPayout,
      reason: `Orbit Puzzle win (${difficulty})${speedBonus > 0 ? ` +${speedBonus} speed bonus` : ""}`,
    },
  });

  revalidatePath("/games");
  revalidatePath("/profile");

  return { totalPayout, speedBonus, newBalance: newPoints };
}

export async function getGameBalance() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return 0;

  const progress = await prisma.userProgress.findUnique({
    where: { userId: session.user.id },
    select: { points: true },
  });

  return progress?.points ?? 0;
}