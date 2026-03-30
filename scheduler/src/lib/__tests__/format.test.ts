/**
 * Testing for lib/format
 */

import { formatEventDate, formatTaskDate, formatLongDate, formatDuration } from "lib/format";

describe("formatEventDate", () => {
  it("formats a Date object to a readable event timestamp", () => {
    const date = new Date("2026-03-15T09:00:00.000Z");
    const result = formatEventDate(date);
    expect(result).toContain("Mar");
    expect(result).toContain("15");
  });

  it("formats an ISO string to a readable event timestamp", () => {
    const result = formatEventDate("2026-03-15T09:00:00.000Z");
    expect(result).toContain("Mar");
  });
});

describe("formatTaskDate", () => {
  it("formats a Date object to a short task due date", () => {
    const result = formatTaskDate(new Date("2026-06-01T00:00:00.000Z"));
    expect(result).toContain("Jun");
    expect(result).toContain("2026");
  });

  it("formats an ISO string to a short task due date", () => {
    const result = formatTaskDate("2026-06-01T00:00:00.000Z");
    expect(result).toContain("Jun");
  });
});

describe("formatLongDate", () => {
  it("formats a date to a long human-readable format", () => {
    const result = formatLongDate(new Date("2026-01-20T00:00:00.000Z"));
    expect(result).toContain("January");
    expect(result).toContain("2026");
  });
});

describe("formatDuration", () => {
  it("returns 'No estimate set' for 0 minutes", () => {
    expect(formatDuration(0)).toBe("No estimate set");
  });

  it("returns 'No estimate set' for negative values", () => {
    expect(formatDuration(-5)).toBe("No estimate set");
  });

  it("formats minutes under 60 as just minutes", () => {
    expect(formatDuration(45)).toBe("45m");
  });

  it("formats exactly 60 minutes as 1h", () => {
    expect(formatDuration(60)).toBe("1h");
  });

  it("formats 90 minutes as 1h 30m", () => {
    expect(formatDuration(90)).toBe("1h 30m");
  });

  it("formats 120 minutes as 2h", () => {
    expect(formatDuration(120)).toBe("2h");
  });

  it("formats 125 minutes as 2h 5m", () => {
    expect(formatDuration(125)).toBe("2h 5m");
  });
});
