'use server'

/**
 * Game economy service
 *
 * Handles coin-based game entry payments and user balance retrieval.
 * Deducts entry costs per difficulty and logs all transactions for auditing.
 */

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DIFFICULTY_CONFIG, Difficulty } from "@/lib/games-config";

/**
 * Deducts coins from the user to enter a game mode based on difficulty.
 * Also records the transaction in the point ledger.
 *
 * @param {Difficulty} difficulty - The selected game difficulty level
 * @returns {Promise<{ success: boolean; newBalance: number }>} Updated balance after payment
 * @throws {Error} If the user is not authenticated, has no progress record, or lacks coins
 */
export async function payGameEntry(difficulty: Difficulty) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const cost = DIFFICULTY_CONFIG[difficulty].cost;

  const progress = await prisma.userProgress.findUnique({
    where: { userId: session.user.id },
  });

  if (!progress) throw new Error("No progress record found");
  if (progress.coins < cost) throw new Error("Not enough coins");

  await prisma.userProgress.update({
    where: { userId: session.user.id },
    data: { coins: { decrement: cost } },
  });

  await prisma.pointTransaction.create({
    data: {
      progressId: progress.id,
      amount: -cost,
      reason: `Orbit Puzzle entry (${difficulty})`,
    },
  });

  return { success: true, newBalance: progress.coins - cost };
}

/**
 * Retrieves the current user's coin balance.
 *
 * @returns {Promise<number>} The user's available coin balance, or 0 if unauthenticated
 */
export async function getGameBalance() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return 0;

  const progress = await prisma.userProgress.findUnique({
    where: { userId: session.user.id },
    select: { coins: true },
  });

  return progress?.coins ?? 0;
}