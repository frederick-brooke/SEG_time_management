/**
 * Tests for src/lib/eventHelpers.ts
 *
 * Covers:
 * - expandRecurringEvents: non-recurring, daily, weekly, monthly recurrence
 * - expandRecurringEvents: exception dates, until limits, duration preservation
 * - expandRecurringEvents: iteration cap (366), missing/unknown recurrence type
 * - buildGoogleRecurrenceRule: all recurrence types, BYDAY generation, edge cases
 */

import { expandRecurringEvents, buildGoogleRecurrenceRule } from "../eventHelpers";
import { addMonths, endOfDay } from "date-fns";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Creates a base non-recurring mock event.
 */
function createEvent(overrides: Record<string, any> = {}) {
  return {
    id: "event-1",
    title: "Test Event",
    start: new Date("2024-06-03T10:00:00Z"), // Monday
    end: new Date("2024-06-03T11:00:00Z"),
    recurrence: null,
    exceptions: [],
    ...overrides,
  };
}

/**
 * Returns a date string in the format used for occurrenceIds and exceptions:
 * ISO without milliseconds, e.g. "2024-06-03T10:00:00Z"
 */
function toOccIso(date: Date): string {
  return date.toISOString().split(".")[0] + "Z";
}

// ── expandRecurringEvents ─────────────────────────────────────────────────────

describe("expandRecurringEvents", () => {
  // ── Non-recurring ───────────────────────────────────────────────────────────

  describe("non-recurring events", () => {
    it("should return a single occurrence for an event with no recurrence", () => {
      const event = createEvent();
      const result = expandRecurringEvents([event]);

      expect(result).toHaveLength(1);
      expect(result[0].occurrenceId).toBe("event-1");
    });

    it("should return a single occurrence when recurrence type is 'none'", () => {
      const event = createEvent({ recurrence: { type: "none" } });
      const result = expandRecurringEvents([event]);

      expect(result).toHaveLength(1);
      expect(result[0].occurrenceId).toBe("event-1");
    });

    it("should preserve all original event fields on non-recurring events", () => {
      const event = createEvent({ title: "Important Meeting", category: "work" });
      const result = expandRecurringEvents([event]);

      expect(result[0].title).toBe("Important Meeting");
      expect(result[0].category).toBe("work");
    });

    it("should expand multiple non-recurring events independently", () => {
      const events = [
        createEvent({ id: "e1" }),
        createEvent({ id: "e2" }),
        createEvent({ id: "e3" }),
      ];
      const result = expandRecurringEvents(events);

      expect(result).toHaveLength(3);
      expect(result.map((e) => e.occurrenceId)).toEqual(["e1", "e2", "e3"]);
    });

    it("should return an empty array when given an empty array", () => {
      expect(expandRecurringEvents([])).toEqual([]);
    });
  });

  // ── Daily recurrence ────────────────────────────────────────────────────────

  describe("daily recurrence", () => {
    it("should generate daily occurrences up to the until date", () => {
      const start = new Date("2024-06-03T10:00:00Z");
      const until = new Date("2024-06-05T10:00:00Z");
      const event = createEvent({
        start,
        end: new Date("2024-06-03T11:00:00Z"),
        recurrence: { type: "daily", until, days: undefined },
      });

      const result = expandRecurringEvents([event]);

      expect(result).toHaveLength(3);
      expect(result[0].start).toEqual(new Date("2024-06-03T10:00:00Z"));
      expect(result[1].start).toEqual(new Date("2024-06-04T10:00:00Z"));
      expect(result[2].start).toEqual(new Date("2024-06-05T10:00:00Z"));
    });

    it("should preserve event duration across daily occurrences", () => {
      const start = new Date("2024-06-03T10:00:00Z");
      const end = new Date("2024-06-03T12:30:00Z"); // 2.5 hours
      const until = new Date("2024-06-04T10:00:00Z");
      const event = createEvent({
        start,
        end,
        recurrence: { type: "daily", until, days: undefined },
      });

      const result = expandRecurringEvents([event]);
      const duration = result[1].end.getTime() - result[1].start.getTime();

      expect(duration).toBe(end.getTime() - start.getTime());
    });

    it("should assign unique occurrenceIds for daily recurrences", () => {
      const start = new Date("2024-06-03T10:00:00Z");
      const until = new Date("2024-06-05T10:00:00Z");
      const event = createEvent({
        start,
        end: new Date("2024-06-03T11:00:00Z"),
        recurrence: { type: "daily", until, days: undefined },
      });

      const result = expandRecurringEvents([event]);
      const ids = result.map((e) => e.occurrenceId);

      expect(new Set(ids).size).toBe(3);
    });

    it("should skip occurrences that are in the exceptions list", () => {
      const start = new Date("2024-06-03T10:00:00Z");
      const until = new Date("2024-06-05T10:00:00Z");
      const skippedDate = new Date("2024-06-04T10:00:00Z");
      const event = createEvent({
        start,
        end: new Date("2024-06-03T11:00:00Z"),
        recurrence: { type: "daily", until, days: undefined },
        exceptions: [toOccIso(skippedDate)],
      });

      const result = expandRecurringEvents([event]);

      expect(result).toHaveLength(2);
      expect(result.map((e) => e.start.toISOString())).not.toContain(
        skippedDate.toISOString()
      );
    });

    it("should default the until limit to 12 months ahead when no until is set", () => {
      const start = new Date();
      start.setHours(10, 0, 0, 0);
      const event = createEvent({
        start,
        end: new Date(start.getTime() + 3600_000),
        recurrence: { type: "daily", until: null, days: undefined },
      });

      const result = expandRecurringEvents([event]);

      // Should produce many occurrences, capped at 366
      expect(result.length).toBeGreaterThan(300);
      expect(result.length).toBeLessThanOrEqual(366);
    });
  });

  // ── Weekly recurrence ───────────────────────────────────────────────────────

  describe("weekly recurrence", () => {
    it("should generate occurrences on the specified days of the week", () => {
      const start = new Date("2024-06-03T10:00:00Z"); // Monday
      const until = new Date("2024-06-14T23:59:59Z"); // two weeks
      const event = createEvent({
        start,
        end: new Date("2024-06-03T11:00:00Z"),
        recurrence: { type: "weekly", until, days: ["Mon", "Wed"] },
      });

      const result = expandRecurringEvents([event]);
      const days = result.map((e) => e.start.getUTCDay());

      // Mon = 1, Wed = 3
      days.forEach((d) => expect([1, 3]).toContain(d));
    });

    it("should generate occurrences for all days in a full week", () => {
      const start = new Date("2024-06-03T10:00:00Z"); // Monday
      const until = new Date("2024-06-09T23:59:59Z"); // Sunday
      const event = createEvent({
        start,
        end: new Date("2024-06-03T11:00:00Z"),
        recurrence: {
          type: "weekly",
          until,
          days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        },
      });

      const result = expandRecurringEvents([event]);

      expect(result.length).toBeGreaterThanOrEqual(6);
    });

    it("should skip weekly occurrences that are in the exceptions list", () => {
      const start = new Date("2024-06-03T10:00:00Z"); // Monday
      const until = new Date("2024-06-17T23:59:59Z");
      const skipped = new Date("2024-06-10T10:00:00Z"); // next Monday
      const event = createEvent({
        start,
        end: new Date("2024-06-03T11:00:00Z"),
        recurrence: { type: "weekly", until, days: ["Mon"] },
        exceptions: [toOccIso(skipped)],
      });

      const result = expandRecurringEvents([event]);
      const starts = result.map((e) => toOccIso(e.start));

      expect(starts).not.toContain(toOccIso(skipped));
    });

    it("should return no occurrences for an unknown day abbreviation", () => {
      const start = new Date("2024-06-03T10:00:00Z");
      const until = new Date("2024-06-09T23:59:59Z");
      const event = createEvent({
        start,
        end: new Date("2024-06-03T11:00:00Z"),
        recurrence: { type: "weekly", until, days: ["XYZ"] },
      });

      const result = expandRecurringEvents([event]);

      expect(result).toHaveLength(0);
    });

    it("should return no occurrences for weekly recurrence with empty days array", () => {
      const start = new Date("2024-06-03T10:00:00Z");
      const until = new Date("2024-06-09T23:59:59Z");
      const event = createEvent({
        start,
        end: new Date("2024-06-03T11:00:00Z"),
        recurrence: { type: "weekly", until, days: [] },
      });

      const result = expandRecurringEvents([event]);

      expect(result).toHaveLength(0);
    });
  });

  // ── Monthly recurrence ──────────────────────────────────────────────────────

  describe("monthly recurrence", () => {
    it("should generate monthly occurrences up to the until date", () => {
      const start = new Date("2024-01-15T10:00:00Z");
      const until = new Date("2024-03-15T10:00:00Z");
      const event = createEvent({
        start,
        end: new Date("2024-01-15T11:00:00Z"),
        recurrence: { type: "monthly", until, days: undefined },
      });

      const result = expandRecurringEvents([event]);

      expect(result).toHaveLength(3);
      expect(result[0].start.getUTCMonth()).toBe(0); // January
      expect(result[1].start.getUTCMonth()).toBe(1); // February
      expect(result[2].start.getUTCMonth()).toBe(2); // March
    });

    it("should preserve event duration across monthly occurrences", () => {
      const start = new Date("2024-01-15T10:00:00Z");
      const end = new Date("2024-01-15T12:00:00Z"); // 2 hours
      const until = new Date("2024-02-15T10:00:00Z");
      const event = createEvent({
        start,
        end,
        recurrence: { type: "monthly", until, days: undefined },
      });

      const result = expandRecurringEvents([event]);
      const duration = result[1].end.getTime() - result[1].start.getTime();

      expect(duration).toBe(end.getTime() - start.getTime());
    });
  });

  // ── Unknown recurrence type ─────────────────────────────────────────────────

  describe("unknown recurrence type", () => {
    it("should return no occurrences for an unrecognised recurrence type", () => {
      const start = new Date("2024-06-03T10:00:00Z");
      const until = new Date("2024-06-10T10:00:00Z");
      const event = createEvent({
        start,
        end: new Date("2024-06-03T11:00:00Z"),
        recurrence: { type: "hourly", until, days: undefined },
      });

      const result = expandRecurringEvents([event]);

      expect(result).toHaveLength(0);
    });
  });

  // ── Iteration cap ───────────────────────────────────────────────────────────

  describe("iteration cap", () => {
    it("should not exceed 366 iterations regardless of until date", () => {
      const start = new Date("2024-01-01T10:00:00Z");
      const until = new Date("2030-01-01T10:00:00Z"); // far future
      const event = createEvent({
        start,
        end: new Date("2024-01-01T11:00:00Z"),
        recurrence: { type: "daily", until, days: undefined },
      });

      const result = expandRecurringEvents([event]);

      expect(result.length).toBeLessThanOrEqual(366);
    });
  });

  // ── Exceptions edge cases ───────────────────────────────────────────────────

  describe("exceptions handling", () => {
    it("should handle exceptions as Date objects as well as ISO strings", () => {
      const start = new Date("2024-06-03T10:00:00Z");
      const until = new Date("2024-06-05T10:00:00Z");
      const skipped = new Date("2024-06-04T10:00:00Z");
      const event = createEvent({
        start,
        end: new Date("2024-06-03T11:00:00Z"),
        recurrence: { type: "daily", until, days: undefined },
        // Pass as Date objects rather than strings
        exceptions: [skipped],
      });

      const result = expandRecurringEvents([event]);

      expect(result).toHaveLength(2);
    });

    it("should treat a null exceptions field as no exceptions", () => {
      const start = new Date("2024-06-03T10:00:00Z");
      const until = new Date("2024-06-04T10:00:00Z");
      const event = createEvent({
        start,
        end: new Date("2024-06-03T11:00:00Z"),
        recurrence: { type: "daily", until, days: undefined },
        exceptions: null,
      });

      const result = expandRecurringEvents([event]);

      expect(result).toHaveLength(2);
    });
  });
});

// ── buildGoogleRecurrenceRule ─────────────────────────────────────────────────

describe("buildGoogleRecurrenceRule", () => {
  // ── Returns undefined ───────────────────────────────────────────────────────

  it("should return undefined when recurrence is null", () => {
    expect(buildGoogleRecurrenceRule(null)).toBeUndefined();
  });

  it("should return undefined when recurrence is undefined", () => {
    expect(buildGoogleRecurrenceRule(undefined)).toBeUndefined();
  });

  it("should return undefined when recurrence type is 'none'", () => {
    expect(
      buildGoogleRecurrenceRule({ type: "none", until: "2024-12-31" })
    ).toBeUndefined();
  });

  it("should return undefined when until is missing", () => {
    expect(
      buildGoogleRecurrenceRule({ type: "daily", until: null })
    ).toBeUndefined();
  });

  it("should return undefined when until is undefined", () => {
    expect(
      buildGoogleRecurrenceRule({ type: "weekly", until: undefined, days: ["Mon"] })
    ).toBeUndefined();
  });

  // ── Daily ───────────────────────────────────────────────────────────────────

  it("should return a daily RRULE string", () => {
    const result = buildGoogleRecurrenceRule({
      type: "daily",
      until: new Date("2024-12-31T23:59:59Z"),
    });

    expect(result).toEqual(
      expect.arrayContaining([expect.stringContaining("FREQ=DAILY")])
    );
    expect(result![0]).toContain("UNTIL=");
    expect(result![0]).not.toContain("BYDAY");
  });

  // ── Weekly ──────────────────────────────────────────────────────────────────

  it("should return a weekly RRULE string with BYDAY", () => {
    const result = buildGoogleRecurrenceRule({
      type: "weekly",
      until: new Date("2024-12-31T23:59:59Z"),
      days: ["Mon", "Wed", "Fri"],
    });

    expect(result![0]).toContain("FREQ=WEEKLY");
    expect(result![0]).toContain("BYDAY=MO,WE,FR");
  });

  it("should uppercase day abbreviations in BYDAY", () => {
    const result = buildGoogleRecurrenceRule({
      type: "weekly",
      until: new Date("2024-12-31T23:59:59Z"),
      days: ["mon", "fri"],
    });

    expect(result![0]).toContain("BYDAY=MO,FR");
  });

  it("should truncate day names to two characters in BYDAY", () => {
    const result = buildGoogleRecurrenceRule({
      type: "weekly",
      until: new Date("2024-12-31T23:59:59Z"),
      days: ["Monday", "Friday"],
    });

    expect(result![0]).toContain("BYDAY=MO,FR");
  });

  it("should not include BYDAY for weekly recurrence with no days", () => {
    const result = buildGoogleRecurrenceRule({
      type: "weekly",
      until: new Date("2024-12-31T23:59:59Z"),
      days: undefined,
    });

    expect(result![0]).not.toContain("BYDAY");
  });

  // ── Monthly ─────────────────────────────────────────────────────────────────

  it("should return a monthly RRULE string", () => {
    const result = buildGoogleRecurrenceRule({
      type: "monthly",
      until: new Date("2024-12-31T23:59:59Z"),
    });

    expect(result![0]).toContain("FREQ=MONTHLY");
    expect(result![0]).not.toContain("BYDAY");
  });

  // ── UNTIL format ────────────────────────────────────────────────────────────

  it("should format the UNTIL date without dashes, colons, or milliseconds", () => {
    const result = buildGoogleRecurrenceRule({
      type: "daily",
      until: new Date("2024-12-31T23:59:59Z"),
    });

    // Should look like UNTIL=20241231T235959Z — no dashes or colons
    expect(result![0]).toMatch(/UNTIL=\d{8}T\d{6}Z/);
    expect(result![0]).not.toContain("-");
    const untilValue = result![0].split("UNTIL=")[1];
    expect(untilValue).not.toContain(":"); 
  });

  it("should accept until as an ISO string as well as a Date object", () => {
    const result = buildGoogleRecurrenceRule({
      type: "daily",
      until: "2024-12-31T23:59:59Z",
    });

    expect(result).toBeDefined();
    expect(result![0]).toContain("FREQ=DAILY");
  });

  // ── Return shape ────────────────────────────────────────────────────────────

  it("should return an array containing exactly one RRULE string", () => {
    const result = buildGoogleRecurrenceRule({
      type: "daily",
      until: new Date("2024-12-31T23:59:59Z"),
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result![0]).toMatch(/^RRULE:/);
  });
});