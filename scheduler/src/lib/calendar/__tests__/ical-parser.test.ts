/**
 * Tests for src/lib/calendar/ical-parser.ts
 */

import { parseICal, parseRRule } from "../ical-parser";

// Helpers

/**
 * Wraps event lines in a VCALENDAR/VEVENT structure.
 */
function buildICal(...eventLines: string[]): string {
  return [
    "BEGIN:VCALENDAR",
    "BEGIN:VEVENT",
    ...eventLines,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Minimal valid iCal event with timed start/end.
 */
const MINIMAL_EVENT_LINES = [
  "UID:test-uid-1",
  "SUMMARY:Test Event",
  "DTSTART:20240603T100000Z",
  "DTEND:20240603T110000Z",
];

// Tests

describe("parseICal", () => {

  it("should parse a minimal valid event", () => {
    const result = parseICal(buildICal(...MINIMAL_EVENT_LINES));

    expect(result).toHaveLength(1);
    expect(result[0].uid).toBe("test-uid-1");
    expect(result[0].summary).toBe("Test Event");
    expect(result[0].dtstart).toEqual(new Date("2024-06-03T10:00:00Z"));
    expect(result[0].dtend).toEqual(new Date("2024-06-03T11:00:00Z"));
    expect(result[0].allDay).toBe(false);
  });

  it("should return an empty array for an empty calendar", () => {
    const result = parseICal("BEGIN:VCALENDAR\r\nEND:VCALENDAR");
    expect(result).toEqual([]);
  });

  it("should parse multiple events from a single feed", () => {
    const ical = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:uid-1",
      "SUMMARY:Event One",
      "DTSTART:20240603T100000Z",
      "DTEND:20240603T110000Z",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:uid-2",
      "SUMMARY:Event Two",
      "DTSTART:20240604T120000Z",
      "DTEND:20240604T130000Z",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const result = parseICal(ical);

    expect(result).toHaveLength(2);
    expect(result[0].uid).toBe("uid-1");
    expect(result[1].uid).toBe("uid-2");
  });

  it("should parse a DESCRIPTION field and unescape \\n and \\,", () => {
    const result = parseICal(
      buildICal(
        ...MINIMAL_EVENT_LINES,
        "DESCRIPTION:Line one\\nLine two\\, with comma"
      )
    );

    expect(result[0].description).toBe("Line one\nLine two, with comma");
  });

  it("should parse optional description as undefined when not present", () => {
    const result = parseICal(buildICal(...MINIMAL_EVENT_LINES));
    expect(result[0].description).toBeUndefined();
  });

  it("should parse an all-day event using VALUE=DATE param", () => {
    const result = parseICal(
      buildICal(
        "UID:allday-uid",
        "SUMMARY:All Day Event",
        "DTSTART;VALUE=DATE:20240603",
        "DTEND;VALUE=DATE:20240604",
      )
    );

    expect(result[0].allDay).toBe(true);
    expect(result[0].dtstart).toEqual(new Date(Date.UTC(2024, 5, 3)));
  });

  it("should parse an all-day event from an 8-digit date string (no VALUE=DATE param)", () => {
    const result = parseICal(
      buildICal(
        "UID:allday-uid",
        "SUMMARY:All Day Event",
        "DTSTART:20240603",
        "DTEND:20240604",
      )
    );

    expect(result[0].allDay).toBe(true);
  });

  it("should default dtend to dtstart + 1 day for all-day events with no DTEND", () => {
    const result = parseICal(
      buildICal(
        "UID:allday-uid",
        "SUMMARY:All Day Event",
        "DTSTART;VALUE=DATE:20240603",
      )
    );

    expect(result[0].dtend).toEqual(new Date(Date.UTC(2024, 5, 4)));
  });

  it("should unfold lines joined by CRLF + whitespace", () => {
    const folded = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:fold-uid",
      "SUMMARY:Folded",
      "DTSTART:20240603T100000Z",
      "DTEND:20240603T110000Z",
      "DESCRIPTION:This is a very long description that has been folded",
      " across multiple lines",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const result = parseICal(folded);

    expect(result[0].description).toContain("folded across multiple lines");
  });

  it("should compute dtend from DURATION when DTEND is absent", () => {
    const result = parseICal(
      buildICal(
        "UID:duration-uid",
        "SUMMARY:Duration Event",
        "DTSTART:20240603T100000Z",
        "DURATION:PT1H30M",
      )
    );

    expect(result[0].dtend).toEqual(new Date("2024-06-03T11:30:00Z"));
  });

  it("should compute dtend from a week-based DURATION", () => {
    const result = parseICal(
      buildICal(
        "UID:week-uid",
        "SUMMARY:Week Event",
        "DTSTART:20240603T100000Z",
        "DURATION:P1W",
      )
    );

    const expected = new Date("2024-06-03T10:00:00Z");
    expected.setDate(expected.getDate() + 7);
    expect(result[0].dtend.getTime()).toBeCloseTo(expected.getTime(), -3);
  });

  it("should compute dtend from a day-based DURATION", () => {
    const result = parseICal(
      buildICal(
        "UID:day-uid",
        "SUMMARY:Day Event",
        "DTSTART:20240603T100000Z",
        "DURATION:P2D",
      )
    );

    const expected = new Date("2024-06-05T10:00:00Z");
    expect(result[0].dtend.getTime()).toBeCloseTo(expected.getTime(), -3);
  });

  it("should parse a RRULE and attach it to the event", () => {
    const result = parseICal(
      buildICal(
        ...MINIMAL_EVENT_LINES,
        "RRULE:FREQ=WEEKLY;BYDAY=MO,WE"
      )
    );

    expect(result[0].rrule).toBe("FREQ=WEEKLY;BYDAY=MO,WE");
  });

  it("should parse a single EXDATE into the exdates array", () => {
    const result = parseICal(
      buildICal(
        ...MINIMAL_EVENT_LINES,
        "EXDATE:20240610T100000Z"
      )
    );

    expect(result[0].exdates).toHaveLength(1);
    expect(result[0].exdates[0]).toEqual(new Date("2024-06-10T10:00:00Z"));
  });

  it("should parse multiple comma-separated EXDATEs", () => {
    const result = parseICal(
      buildICal(
        ...MINIMAL_EVENT_LINES,
        "EXDATE:20240610T100000Z,20240617T100000Z"
      )
    );

    expect(result[0].exdates).toHaveLength(2);
  });

  it("should initialise exdates as an empty array when no EXDATE is present", () => {
    const result = parseICal(buildICal(...MINIMAL_EVENT_LINES));
    expect(result[0].exdates).toEqual([]);
  });

  it("should discard an event missing UID", () => {
    const result = parseICal(
      buildICal(
        "SUMMARY:No UID",
        "DTSTART:20240603T100000Z",
        "DTEND:20240603T110000Z",
      )
    );

    expect(result).toHaveLength(0);
  });

  it("should discard an event missing SUMMARY", () => {
    const result = parseICal(
      buildICal(
        "UID:no-summary-uid",
        "DTSTART:20240603T100000Z",
        "DTEND:20240603T110000Z",
      )
    );

    expect(result).toHaveLength(0);
  });

  it("should discard an event missing DTSTART", () => {
    const result = parseICal(
      buildICal(
        "UID:no-start-uid",
        "SUMMARY:No Start",
        "DTEND:20240603T110000Z",
      )
    );

    expect(result).toHaveLength(0);
  });

  it("should discard an event where dtend cannot be resolved", () => {
    // No DTEND, no DURATION, not an all-day event
    const result = parseICal(
      buildICal(
        "UID:no-end-uid",
        "SUMMARY:No End",
        "DTSTART:20240603T100000Z",
      )
    );

    expect(result).toHaveLength(0);
  });

  it("should parse a local (non-Z) timestamp as a local Date", () => {
    const result = parseICal(
      buildICal(
        "UID:local-uid",
        "SUMMARY:Local Event",
        "DTSTART:20240603T100000",
        "DTEND:20240603T110000",
      )
    );

    // Local time — just verify it parsed without error
    expect(result[0].dtstart).toBeInstanceOf(Date);
    expect(isNaN(result[0].dtstart.getTime())).toBe(false);
  });

  it("should silently ignore lines without a colon", () => {
    const ical = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:colon-uid",
      "SUMMARY:Colon Test",
      "DTSTART:20240603T100000Z",
      "DTEND:20240603T110000Z",
      "X-INVALID-LINE-NO-COLON",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const result = parseICal(ical);

    expect(result).toHaveLength(1);
    expect(result[0].uid).toBe("colon-uid");
  });
});


describe("parseRRule", () => {

  it("should parse a daily RRULE", () => {
    const result = parseRRule("FREQ=DAILY");

    expect(result).toMatchObject({ type: "daily" });
  });

  it("should parse a weekly RRULE", () => {
    const result = parseRRule("FREQ=WEEKLY");

    expect(result).toMatchObject({ type: "weekly" });
  });

  it("should parse a monthly RRULE", () => {
    const result = parseRRule("FREQ=MONTHLY");

    expect(result).toMatchObject({ type: "monthly" });
  });

  it("should return null for an unsupported frequency (HOURLY)", () => {
    expect(parseRRule("FREQ=HOURLY")).toBeNull();
  });

  it("should return null for an unsupported frequency (YEARLY)", () => {
    expect(parseRRule("FREQ=YEARLY")).toBeNull();
  });

  it("should return null when FREQ is missing entirely", () => {
    expect(parseRRule("BYDAY=MO")).toBeNull();
  });

  it("should strip the RRULE: prefix before parsing", () => {
    const result = parseRRule("RRULE:FREQ=DAILY");

    expect(result).toMatchObject({ type: "daily" });
  });

  it("should strip a lowercase rrule: prefix", () => {
    const result = parseRRule("rrule:FREQ=DAILY");

    expect(result).toMatchObject({ type: "daily" });
  });

  it("should parse the UNTIL date into a Date object", () => {
    const result = parseRRule("FREQ=DAILY;UNTIL=20241231T000000Z") as any;

    expect(result.until).toBeInstanceOf(Date);
    expect(result.until.getUTCFullYear()).toBe(2024);
    expect(result.until.getUTCMonth()).toBe(11); // December
    expect(result.until.getUTCDate()).toBe(31);
  });

  it("should set until to null when COUNT is provided instead of UNTIL", () => {
    const result = parseRRule("FREQ=DAILY;COUNT=10") as any;

    expect(result.until).toBeNull();
  });

  it("should default until to approximately 1 year ahead when neither UNTIL nor COUNT present", () => {
    const before = Date.now();
    const result = parseRRule("FREQ=DAILY") as any;
    const after = Date.now();

    const oneYear = 365 * 24 * 60 * 60 * 1000;
    expect(result.until.getTime()).toBeGreaterThanOrEqual(before + oneYear - 1000);
    expect(result.until.getTime()).toBeLessThanOrEqual(after + oneYear + 1000);
  });

  it("should parse BYDAY for weekly recurrence and map abbreviations to full names", () => {
    const result = parseRRule("FREQ=WEEKLY;BYDAY=MO,WE,FR") as any;

    expect(result.days).toEqual(["Mon", "Wed", "Fri"]);
  });

  it("should map all seven day abbreviations correctly", () => {
    const result = parseRRule("FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR,SA") as any;

    expect(result.days).toEqual(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
  });

  it("should not include days property for non-weekly frequencies", () => {
    const result = parseRRule("FREQ=DAILY;BYDAY=MO") as any;

    expect(result.days).toBeUndefined();
  });

  it("should not include days property for weekly recurrence without BYDAY", () => {
    const result = parseRRule("FREQ=WEEKLY") as any;

    expect(result.days).toBeUndefined();
  });

  it("should be case-insensitive for the frequency value", () => {
    const result = parseRRule("FREQ=daily");

    expect(result).toMatchObject({ type: "daily" });
  });
});