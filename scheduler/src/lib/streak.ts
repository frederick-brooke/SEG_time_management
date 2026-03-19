import { prisma } from "lib/prisma";
import { consumeStreakShield } from "lib/points";


/**
 * Converts an array of completedAt timestamps into a sorted descending list
 * of unique midnight-normalised day timestamps
 * @param {(Date | null)[]} completedAts - Raw completedAt values from task records
 * @return {number[]} - Sorted unique day timestamps in descending order
 */
export function toUniqueDays(completedAts: (Date | null)[]): number[] {
  const days = completedAts
    .filter((d): d is Date => d !== null)
    .map((d) => {
      const day = new Date(d);
      day.setHours(0, 0, 0, 0);
      return day.getTime();
    });
  return [...new Set(days)].sort((a, b) => b - a);
}

/**
 * Returns the number of days between the most recent completion day and today
 * @param {number[]} uniqueDays - Sorted descending list of unique day timestamps
 * @param {number} today - Today's midnight timestamp in milliseconds
 * @return {number} - Days since most recent completion (0 = today, Infinity = no completions)
 */
export function daysSinceMostRecent(
  uniqueDays: number[],
  today: number
): number {
  if (uniqueDays.length === 0) return Infinity;
  return Math.floor((today - uniqueDays[0]) / 86_400_000);
}

/**
 * Counts the current consecutive day streak from a sorted list of unique day timestamps
 * @param {number[]} uniqueDays - Sorted descending list of unique day timestamps
 * @param {number} today - Today's midnight timestamp in milliseconds
 * @return {number} - Length of the current streak in days
 */
export function countStreak(uniqueDays: number[], today: number): number {
  let streak = 0;
  let expected = today;

  for (const day of uniqueDays) {
    const diff = Math.floor((expected - day) / 86_400_000);
    if (diff === 0 || diff === 1) {
      streak++;
      expected = day - 86_400_000;
    } else {
      break;
    }
  }
  return streak;
}

//streaks
/**
 * Calculates the current streak for a user, consuming a streak shield if needed
 * @param {string} userId - The database ID of the user
 * @return {Promise<number>} - Current streak length in days
 */
export async function calculateStreak(userId: string): Promise<number> {
  const tasks = await prisma.task.findMany({
    where: { userId, completed: true, completedAt: { not: null } },
    select: { completedAt: true },
  });

  if (tasks.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  const uniqueDays = toUniqueDays(tasks.map((t) => t.completedAt));
  const gap = daysSinceMostRecent(uniqueDays, todayMs);

  if (gap > 2) return 0;

  // If exactly one day was missed, attempt to consume a streak shield
  if (gap === 2) {
    const shieldUsed = await consumeStreakShield(userId);
    if (!shieldUsed) return 0;
  }

  return countStreak(uniqueDays, todayMs);
}