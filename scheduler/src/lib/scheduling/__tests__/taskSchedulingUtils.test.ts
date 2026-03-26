import { getNextOccurrenceDeadline, shouldShowAsUnscheduled } from "../taskSchedulingUtils";
import { addDays, addMonths } from "date-fns";

// ── Helpers ────────

function makeFrom(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

const FUTURE = makeFrom("2030-06-01");
const PAST   = makeFrom("2020-01-01");

function nonRecurringEvent(start: Date) {
  return { id: "ev-1", start, end: start };
}

function recurringEvent(type: string, days?: string[], until?: Date) {
  return {
    id: "ev-1",
    start: new Date("2030-05-26"), // a Monday
    end:   new Date("2030-05-26"),
    recurrence: { type, days, until },
  };
}

// ── getNextOccurrenceDeadline — non-recurring ───

describe("getNextOccurrenceDeadline — non-recurring", () => {
  it("returns the event start date when offset is 0 and event is in the future", () => {
    const event = nonRecurringEvent(new Date("2030-06-10"));
    const result = getNextOccurrenceDeadline(event, 0, FUTURE);
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2030);
    expect(result!.getMonth()).toBe(5);
    expect(result!.getDate()).toBe(10);
  });

  it("returns null when event is in the past relative to from", () => {
    const event = nonRecurringEvent(new Date("2020-01-01"));
    const result = getNextOccurrenceDeadline(event, 0, FUTURE);
    expect(result).toBeNull();
  });

  it("applies positive offset correctly", () => {
    const event = nonRecurringEvent(new Date("2030-06-10"));
    const result = getNextOccurrenceDeadline(event, 2, FUTURE);
    expect(result!.getDate()).toBe(12);
  });

  it("applies negative offset correctly", () => {
    const event = nonRecurringEvent(new Date("2030-06-10"));
    const result = getNextOccurrenceDeadline(event, -2, FUTURE);
    expect(result!.getDate()).toBe(8);
  });

  it("returns null when offset pushes result before fromDay", () => {
    const event = nonRecurringEvent(new Date("2030-06-01"));
    const result = getNextOccurrenceDeadline(event, -5, FUTURE);
    expect(result).toBeNull();
  });

  it("handles recurrence type of none as non-recurring", () => {
    const event = { ...nonRecurringEvent(new Date("2030-06-10")), recurrence: { type: "none" } };
    const result = getNextOccurrenceDeadline(event, 0, FUTURE);
    expect(result).not.toBeNull();
  });

  it("uses today as default from when not provided", () => {
    const futureEvent = nonRecurringEvent(addDays(new Date(), 10));
    const result = getNextOccurrenceDeadline(futureEvent, 0);
    expect(result).not.toBeNull();
  });

  it("defaults relativeOffsetDays to 0 when null is passed", () => {
    const event = nonRecurringEvent(new Date("2030-06-10"));
    const result = getNextOccurrenceDeadline(event, null as any, FUTURE);
    expect(result!.getDate()).toBe(10);
  });
});

// ── getNextOccurrenceDeadline — daily 

describe("getNextOccurrenceDeadline — daily recurrence", () => {
  it("returns the first occurrence on or after fromDay", () => {
    const event = recurringEvent("daily");
    const from = makeFrom("2030-05-28");
    const result = getNextOccurrenceDeadline(event, 0, from);
    expect(result).not.toBeNull();
    expect(result!.getTime()).toBeGreaterThanOrEqual(from.getTime());
  });

  it("applies offset to daily occurrence", () => {
    const event = recurringEvent("daily");
    const from = makeFrom("2030-05-26");
    const result = getNextOccurrenceDeadline(event, 1, from);
    expect(result!.getDate()).toBe(27);
  });

  it("returns null when until date has passed", () => {
    const until = new Date("2030-05-25");
    const event = { ...recurringEvent("daily"), recurrence: { type: "daily", until } };
    const result = getNextOccurrenceDeadline(event, 0, FUTURE);
    expect(result).toBeNull();
  });
});

// ── getNextOccurrenceDeadline — monthly ─────────

describe("getNextOccurrenceDeadline — monthly recurrence", () => {
  it("returns the first monthly occurrence on or after fromDay", () => {
    const event = recurringEvent("monthly");
    const from = makeFrom("2030-05-26");
    const result = getNextOccurrenceDeadline(event, 0, from);
    expect(result).not.toBeNull();
    expect(result!.getTime()).toBeGreaterThanOrEqual(from.getTime());
  });

  it("advances month when cursor is before fromDay", () => {
    const event = recurringEvent("monthly");
    const from = makeFrom("2030-06-01");
    const result = getNextOccurrenceDeadline(event, 0, from);
    expect(result!.getMonth()).toBe(5); // June
  });

  it("applies offset to monthly occurrence", () => {
    const event = recurringEvent("monthly");
    const from = makeFrom("2030-05-26");
    const result = getNextOccurrenceDeadline(event, 3, from);
    expect(result!.getDate()).toBe(29);
  });

  it("returns null when until has passed", () => {
    const until = new Date("2030-05-25");
    const event = { ...recurringEvent("monthly"), recurrence: { type: "monthly", until } };
    const result = getNextOccurrenceDeadline(event, 0, FUTURE);
    expect(result).toBeNull();
  });
});

// ── getNextOccurrenceDeadline — weekly 

describe("getNextOccurrenceDeadline — weekly recurrence", () => {
  it("returns the next weekly occurrence on or after fromDay", () => {
    const event = recurringEvent("weekly", ["Mon"]);
    const from = makeFrom("2030-05-26"); // Monday
    const result = getNextOccurrenceDeadline(event, 0, from);
    expect(result).not.toBeNull();
    expect(result!.getDay()).toBe(1); // Monday
  });

  it("applies offset to weekly occurrence", () => {
    const event = recurringEvent("weekly", ["Mon"]);
    const from = makeFrom("2030-05-26");
    const result = getNextOccurrenceDeadline(event, -1, from);
    expect(result!.getDay()).toBe(0); // Sunday
  });

  it("picks earliest candidate when multiple days selected", () => {
    const event = recurringEvent("weekly", ["Wed", "Mon"]);
    const from = makeFrom("2030-05-26"); // Monday
    const result = getNextOccurrenceDeadline(event, 0, from);
    expect(result!.getDay()).toBe(1); // Monday comes first
  });

  it("advances to next week when no candidates in current week", () => {
    const event = recurringEvent("weekly", ["Fri"]);
    const from = makeFrom("2030-05-31"); // Saturday — past this week's Friday
    const result = getNextOccurrenceDeadline(event, 0, from);
    expect(result).not.toBeNull();
    expect(result!.getDay()).toBe(5); // Friday
  });

  it("skips unknown day names", () => {
    const event = recurringEvent("weekly", ["Xyz", "Mon"]);
    const from = makeFrom("2030-05-26");
    const result = getNextOccurrenceDeadline(event, 0, from);
    expect(result).not.toBeNull(); // Mon still valid
  });

  it("returns null when recDays is empty", () => {
    const event = recurringEvent("weekly", []);
    const result = getNextOccurrenceDeadline(event, 0, FUTURE);
    expect(result).toBeNull();
  });

  it("returns null when until has passed", () => {
    const until = new Date("2030-05-25");
    const event = { ...recurringEvent("weekly", ["Mon"]), recurrence: { type: "weekly", days: ["Mon"], until } };
    const result = getNextOccurrenceDeadline(event, 0, FUTURE);
    expect(result).toBeNull();
  });

  it("returns null when all weekly candidates are beyond limitDate", () => {
    const until = addMonths(FUTURE, 1);
    const event = {
      id: "ev-1",
      start: new Date("2030-06-02"),
      end: new Date("2030-06-02"),
      recurrence: { type: "weekly", days: ["Mon"], until },
    };
    const from = makeFrom("2030-07-10"); // past until
    const result = getNextOccurrenceDeadline(event, 0, from);
    expect(result).toBeNull();
  });
});

// ── getNextOccurrenceDeadline — unknown type ────

describe("getNextOccurrenceDeadline — unknown recurrence type", () => {
  it("returns null for unrecognised recurrence type", () => {
    const event = recurringEvent("fortnightly");
    const result = getNextOccurrenceDeadline(event, 0, FUTURE);
    expect(result).toBeNull();
  });
});

// ── shouldShowAsUnscheduled 

describe("shouldShowAsUnscheduled — completed tasks", () => {
  it("never shows completed tasks", () => {
    expect(shouldShowAsUnscheduled({ completed: true, scheduledDate: null }, [])).toBe(false);
  });
});

describe("shouldShowAsUnscheduled — never scheduled", () => {
  it("always shows tasks with no scheduledDate", () => {
    expect(shouldShowAsUnscheduled({ completed: false, scheduledDate: null }, [])).toBe(true);
  });
});

describe("shouldShowAsUnscheduled — scheduled in future", () => {
  it("does not show tasks scheduled today or in the future", () => {
    const tomorrow = addDays(new Date(), 1);
    const task = { completed: false, scheduledDate: tomorrow };
    expect(shouldShowAsUnscheduled(task, [])).toBe(false);
  });

  it("does not show tasks scheduled today", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const task = { completed: false, scheduledDate: today };
    expect(shouldShowAsUnscheduled(task, [])).toBe(false);
  });
});

describe("shouldShowAsUnscheduled — scheduled in past", () => {
  it("shows non-recurring tasks scheduled in the past", () => {
    const task = { completed: false, scheduledDate: PAST, isRecurring: false, eventId: null };
    expect(shouldShowAsUnscheduled(task, [])).toBe(true);
  });

  it("shows tasks with no eventId even if isRecurring is true", () => {
    const task = { completed: false, scheduledDate: PAST, isRecurring: true, eventId: null };
    expect(shouldShowAsUnscheduled(task, [])).toBe(true);
  });

  it("shows recurring task when linked event is not found", () => {
    const task = { completed: false, scheduledDate: PAST, isRecurring: true, eventId: "missing" };
    expect(shouldShowAsUnscheduled(task, [])).toBe(true);
  });

  it("shows recurring task when next occurrence exists", () => {
    const futureEvent = {
      id: "ev-1",
      start: addDays(new Date(), 7),
      end: addDays(new Date(), 7),
    };
    const task = { completed: false, scheduledDate: PAST, isRecurring: true, eventId: "ev-1", relativeOffsetDays: 0 };
    expect(shouldShowAsUnscheduled(task, [futureEvent])).toBe(true);
  });

  it("does not show recurring task when no future occurrence exists", () => {
    const pastEvent = { id: "ev-1", start: PAST, end: PAST };
    const task = { completed: false, scheduledDate: PAST, isRecurring: true, eventId: "ev-1", relativeOffsetDays: 0 };
    expect(shouldShowAsUnscheduled(task, [pastEvent])).toBe(false);
  });

  it("uses relativeOffsetDays of 0 when not provided", () => {
    const futureEvent = { id: "ev-1", start: addDays(new Date(), 7), end: addDays(new Date(), 7) };
    const task = { completed: false, scheduledDate: PAST, isRecurring: true, eventId: "ev-1" };
    expect(shouldShowAsUnscheduled(task, [futureEvent])).toBe(true);
  });
});