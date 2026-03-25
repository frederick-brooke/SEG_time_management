/**
 * Constants for the leveling system.
 */
export const XP_PER_LEVEL = 100;

/**
 * Calculates user level and progress metrics based on total accumulated points.
 * @param {number} totalPoints - The total XP points the user has earned.
 * @returns {object} The calculated level, progress percentage, and XP needed for the next level.
 */
export function calculateLevelProgress(totalPoints: number = 0) {
  const level = Math.floor(totalPoints / XP_PER_LEVEL) + 1;
  const xpIntoLevel = totalPoints % XP_PER_LEVEL;
  const xpBarWidth = Math.min((xpIntoLevel / XP_PER_LEVEL) * 100, 100);
  const xpToNext = XP_PER_LEVEL - xpIntoLevel;

  return { level, xpIntoLevel, xpBarWidth, xpToNext };
}