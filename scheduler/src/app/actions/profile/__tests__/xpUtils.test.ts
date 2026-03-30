/**
 * Testing for profile/xpUtils actions.
 */

import { calculateLevelProgress, XP_PER_LEVEL } from '../xpUtils';

describe('XP Math Utility', () => {
  // Confirms base level calculation for a new user with 0 points.
  it('calculates level 1 correctly for 0 points', () => {
    const result = calculateLevelProgress(0);
    expect(result.level).toBe(1);
    expect(result.xpBarWidth).toBe(0);
    expect(result.xpToNext).toBe(XP_PER_LEVEL);
  });

  // Confirms mid-level progress calculations reflect accurate bar widths.
  it('calculates mid-level progress correctly', () => {
    const result = calculateLevelProgress(150);
    expect(result.level).toBe(2);
    expect(result.xpBarWidth).toBe(50);
    expect(result.xpToNext).toBe(50);
  });

  // Confirms exact level boundary calculation does not roll over incorrectly.
  it('calculates exact level boundaries correctly', () => {
    const result = calculateLevelProgress(300);
    expect(result.level).toBe(4);
    expect(result.xpBarWidth).toBe(0);
    expect(result.xpToNext).toBe(100);
  });
});