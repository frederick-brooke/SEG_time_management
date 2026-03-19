import { toUniqueDays, daysSinceMostRecent, countStreak } from "lib/streak";

// ─── toUniqueDays ─────────────────────────────────────────────────────────────

describe("toUniqueDays", () => {
  it("returns empty array for empty input", () => {
    expect(toUniqueDays([])).toEqual([]);
  });

  it("filters out null values", () => {
    const result = toUniqueDays([null, null]);
    expect(result).toEqual([]);
  });

  it("normalises dates to midnight and deduplicates", () => {
    const d1 = new Date("2026-03-15T09:00:00.000Z");
    const d2 = new Date("2026-03-15T21:00:00.000Z");
    const result = toUniqueDays([d1, d2]);
    expect(result).toHaveLength(1);
  });

  it("returns dates sorted descending", () => {
    const d1 = new Date("2026-03-13T00:00:00.000Z");
    const d2 = new Date("2026-03-15T00:00:00.000Z");
    const d3 = new Date("2026-03-14T00:00:00.000Z");
    const result = toUniqueDays([d1, d2, d3]);
    expect(result[0]).toBeGreaterThan(result[1]);
    expect(result[1]).toBeGreaterThan(result[2]);
  });

  it("handles mixed null and valid dates", () => {
    const d = new Date("2026-03-15T00:00:00.000Z");
    const result = toUniqueDays([null, d, null]);
    expect(result).toHaveLength(1);
  });
});

// ─── daysSinceMostRecent ──────────────────────────────────────────────────────

describe("daysSinceMostRecent", () => {
  it("returns Infinity for empty array", () => {
    expect(daysSinceMostRecent([], Date.now())).toBe(Infinity);
  });

  it("returns 0 when most recent day is today", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = daysSinceMostRecent([today.getTime()], today.getTime());
    expect(result).toBe(0);
  });

  it("returns 1 when most recent day was yesterday", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = today.getTime() - 86_400_000;
    const result = daysSinceMostRecent([yesterday], today.getTime());
    expect(result).toBe(1);
  });

  it("returns 2 when most recent day was two days ago", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoDaysAgo = today.getTime() - 2 * 86_400_000;
    const result = daysSinceMostRecent([twoDaysAgo], today.getTime());
    expect(result).toBe(2);
  });
});

// ─── countStreak ─────────────────────────────────────────────────────────────

describe("countStreak", () => {
  it("returns 0 for empty array", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(countStreak([], today.getTime())).toBe(0);
  });

  it("returns 1 for a single entry today", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(countStreak([today.getTime()], today.getTime())).toBe(1);
  });

  it("returns 1 for a single entry yesterday", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = today.getTime() - 86_400_000;
    expect(countStreak([yesterday], today.getTime())).toBe(1);
  });

  it("counts consecutive days correctly", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = [0, 1, 2, 3].map((n) => today.getTime() - n * 86_400_000);
    expect(countStreak(days, today.getTime())).toBe(4);
  });

  it("stops counting at a gap", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // today, yesterday, then a gap, then 4 days ago
    const days = [
      today.getTime(),
      today.getTime() - 86_400_000,
      today.getTime() - 4 * 86_400_000,
    ];
    expect(countStreak(days, today.getTime())).toBe(2);
  });
});
