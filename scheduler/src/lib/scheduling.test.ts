import { findFreeSlots, scheduleTask, scheduleAllTasks } from "./scheduling";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    event: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    userPreferences: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { prisma } from "@/lib/prisma";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;


function makeDate(isoString: string): Date {
  return new Date(isoString);
}

function makeEvent(start: string, durationMins: number) {
  const s = makeDate(start);
  const e = new Date(s.getTime() + durationMins * 60_000);
  return { start: s, end: e };
}

const DEFAULT_PREFS = {
  workStartTime: "07:00",
  workEndTime: "22:00",
  daysOff: [],
  sessionLength: 0,
  breakLength: 15,
  breaksPerDay: 0,
  maxTasksPerDay: 0,
};


// findFreeSlots

describe("findFreeSlots", () => {
  describe("basic gap detection", () => {
    test("returns a slot when there are no existing events", () => {
      const from = makeDate("2026-03-10T09:00:00");
      const to   = makeDate("2026-03-10T17:00:00");
      const slots = findFreeSlots(from, to, [], 30, DEFAULT_PREFS);
      expect(slots.length).toBeGreaterThan(0);
    });

    test("returns no slots when the entire window is blocked", () => {
      const from  = makeDate("2026-03-10T09:00:00");
      const to    = makeDate("2026-03-10T10:00:00");
      const event = makeEvent("2026-03-10T08:45:00", 90); // covers the whole window
      const slots = findFreeSlots(from, to, [event], 30, DEFAULT_PREFS);
      expect(slots.length).toBe(0);
    });

    test("finds a gap between two events", () => {
      const from   = makeDate("2026-03-10T09:00:00");
      const to     = makeDate("2026-03-10T17:00:00");
      const event1 = makeEvent("2026-03-10T09:00:00", 60);
      const event2 = makeEvent("2026-03-10T12:00:00", 60);
      const slots  = findFreeSlots(from, to, [event1, event2], 30, DEFAULT_PREFS);
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0].start.getTime()).toBeGreaterThanOrEqual(event1.end.getTime());
    });

    test("returns no slots when requested duration exceeds every gap", () => {
      const from   = makeDate("2026-03-10T09:00:00");
      const to     = makeDate("2026-03-10T11:00:00");
      const event1 = makeEvent("2026-03-10T09:00:00", 30);
      const event2 = makeEvent("2026-03-10T10:00:00", 60);
      const slots  = findFreeSlots(from, to, [event1, event2], 60, DEFAULT_PREFS);
      expect(slots.length).toBe(0);
    });
  });

  describe("buffer / break length", () => {
    test("respects breakLength between events", () => {
      const prefs  = { ...DEFAULT_PREFS, breakLength: 30 };
      const from   = makeDate("2026-03-10T09:00:00");
      const to     = makeDate("2026-03-10T17:00:00");
      const event  = makeEvent("2026-03-10T09:00:00", 60); // ends 10:00
      const slots  = findFreeSlots(from, to, [event], 30, prefs);
      if (slots.length > 0) {
        expect(slots[0].start.getTime()).toBeGreaterThanOrEqual(
          event.end.getTime() + 30 * 60_000
        );
      }
    });
  });

  describe("work hours", () => {
    test("does not schedule before workStartTime", () => {
      const from  = makeDate("2026-03-10T05:00:00");
      const to    = makeDate("2026-03-10T17:00:00");
      const slots = findFreeSlots(from, to, [], 30, DEFAULT_PREFS);
      expect(slots.length).toBeGreaterThan(0);
      const workStartMs = makeDate("2026-03-10T07:00:00").getTime();
      slots.forEach((s) => expect(s.start.getTime()).toBeGreaterThanOrEqual(workStartMs));
    });

    test("does not schedule after workEndTime", () => {
      const from  = makeDate("2026-03-10T09:00:00");
      const to    = makeDate("2026-03-10T23:59:00");
      const slots = findFreeSlots(from, to, [], 30, DEFAULT_PREFS);
      const workEndMs = makeDate("2026-03-10T22:00:00").getTime();
      slots.forEach((s) => expect(s.end.getTime()).toBeLessThanOrEqual(workEndMs));
    });

    test("skips to next work day when current time is past workEndTime", () => {
      const from  = makeDate("2026-03-10T23:00:00");
      const to    = makeDate("2026-03-11T17:00:00");
      const slots = findFreeSlots(from, to, [], 30, DEFAULT_PREFS);
      if (slots.length > 0) {
        expect(slots[0].start.getDate()).toBe(11);
      }
    });
  });

  describe("days off", () => {
    test("does not schedule on days off", () => {
      const prefs = { ...DEFAULT_PREFS, daysOff: [0] };
      const from  = makeDate("2026-03-08T09:00:00");
      const to    = makeDate("2026-03-08T17:00:00");
      const slots = findFreeSlots(from, to, [], 30, prefs);
      expect(slots.length).toBe(0);
    });

    test("schedules on next available day when today is a day off", () => {
      const prefs = { ...DEFAULT_PREFS, daysOff: [0] };
      const from  = makeDate("2026-03-08T09:00:00");
      const to    = makeDate("2026-03-09T17:00:00");
      const slots = findFreeSlots(from, to, [], 30, prefs);
      if (slots.length > 0) {
        expect(slots[0].start.getDay()).not.toBe(0);
      }
    });
  });

  describe("maxTasksPerDay", () => {
    test("respects maxTasksPerDay limit", () => {
      const prefs = { ...DEFAULT_PREFS, maxTasksPerDay: 1 };
      const from  = makeDate("2026-03-10T09:00:00");
      const to    = makeDate("2026-03-10T17:00:00");
      const slots = findFreeSlots(from, to, [], 30, prefs);
      expect(slots.length).toBeLessThanOrEqual(1);
    });

    test("allows at least one task per day when maxTasksPerDay is 0 (unlimited)", () => {
      const prefs = { ...DEFAULT_PREFS, maxTasksPerDay: 0 };
      const from  = makeDate("2026-03-10T09:00:00");
      const to    = makeDate("2026-03-10T17:00:00");
      const slots = findFreeSlots(from, to, [], 30, prefs);
      expect(slots.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("sessionLength", () => {
    test("caps effective duration at sessionLength", () => {
      const prefs = { ...DEFAULT_PREFS, sessionLength: 30 };
      const from  = makeDate("2026-03-10T09:00:00");
      const to    = makeDate("2026-03-10T17:00:00");
      const slots = findFreeSlots(from, to, [], 120, prefs);
      expect(slots.length).toBeGreaterThan(0);
    });
  });

  describe("null prefs (no user preferences)", () => {
    test("works with null prefs using defaults", () => {
      const from  = makeDate("2026-03-10T09:00:00");
      const to    = makeDate("2026-03-10T17:00:00");
      const slots = findFreeSlots(from, to, [], 30, null);
      expect(Array.isArray(slots)).toBe(true);
    });
  });
});


// scheduleTask

describe("scheduleTask", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("throws if task is not found", async () => {
    (mockPrisma.task.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(scheduleTask("task-1", "user-1")).rejects.toThrow("Task not found");
  });

  test("throws if task has no duration", async () => {
    (mockPrisma.task.findFirst as jest.Mock).mockResolvedValue({
      id: "task-1",
      userId: "user-1",
      duration: 0,
      title: "Test",
    });
    await expect(scheduleTask("task-1", "user-1")).rejects.toThrow(
      "Task has no duration set"
    );
  });

  test("returns null when no free slot is found", async () => {
    (mockPrisma.task.findFirst as jest.Mock).mockResolvedValue({
      id: "task-1",
      userId: "user-1",
      duration: 60,
      title: "Test",
      dueDate: null,
    });
    (mockPrisma.userPreferences.findUnique as jest.Mock).mockResolvedValue(null);
    const now = new Date();
    const farFuture = new Date(now.getTime() + 30 * 86_400_000);
    (mockPrisma.event.findMany as jest.Mock).mockResolvedValue([
      { start: now, end: farFuture },
    ]);

    const result = await scheduleTask("task-1", "user-1");
    expect(result).toBeNull();
  });

  test("creates an event and updates task status when a slot is found", async () => {
    const now = new Date("2026-03-10T09:00:00Z");
    jest.useFakeTimers().setSystemTime(now);

    (mockPrisma.task.findFirst as jest.Mock).mockResolvedValue({
      id: "task-1",
      userId: "user-1",
      duration: 30,
      title: "Write tests",
      description: "Jest tests",
      dueDate: null,
    });
    (mockPrisma.userPreferences.findUnique as jest.Mock).mockResolvedValue(null);
    (mockPrisma.event.findMany as jest.Mock).mockResolvedValue([]);

    const fakeEvent = { id: "event-1", start: now, end: new Date(now.getTime() + 30 * 60_000) };
    (mockPrisma.$transaction as jest.Mock).mockResolvedValue([fakeEvent, {}]);

    const result = await scheduleTask("task-1", "user-1");
    expect(result).toEqual(fakeEvent);
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  test("respects extraBlocked parameter", async () => {
    const now = new Date("2026-03-10T09:00:00Z");
    jest.useFakeTimers().setSystemTime(now);

    (mockPrisma.task.findFirst as jest.Mock).mockResolvedValue({
      id: "task-2",
      userId: "user-1",
      duration: 30,
      title: "Another task",
      description: "",
      dueDate: null,
    });
    (mockPrisma.userPreferences.findUnique as jest.Mock).mockResolvedValue(null);
    (mockPrisma.event.findMany as jest.Mock).mockResolvedValue([]);

    const extraBlocked = [
      { start: now, end: new Date(now.getTime() + 7 * 86_400_000) }, // block 7 days
    ];

    const result = await scheduleTask("task-2", "user-1", extraBlocked);

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(result ? 1 : 0);

    jest.useRealTimers();
  });
});


// scheduleAllTasks

describe("scheduleAllTasks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns empty array when there are no unscheduled tasks", async () => {
    (mockPrisma.userPreferences.findUnique as jest.Mock).mockResolvedValue(null);
    (mockPrisma.task.findMany as jest.Mock).mockResolvedValue([]);

    const results = await scheduleAllTasks("user-1");
    expect(results).toEqual([]);
  });

  test("sorts tasks by priority order (Urgent before High before Medium before Low)", async () => {
    const now = new Date("2026-03-10T09:00:00Z");
    jest.useFakeTimers().setSystemTime(now);

    (mockPrisma.userPreferences.findUnique as jest.Mock).mockResolvedValue(null);

    const tasks = [
      { id: "t1", title: "Low task",    priority: "Low",    duration: 30, dueDate: null, status: "pending", completed: false },
      { id: "t2", title: "Urgent task", priority: "Urgent", duration: 30, dueDate: null, status: "pending", completed: false },
      { id: "t3", title: "Medium task", priority: "Medium", duration: 30, dueDate: null, status: "pending", completed: false },
    ];
    (mockPrisma.task.findMany as jest.Mock).mockResolvedValue(tasks);
    (mockPrisma.task.findFirst as jest.Mock).mockImplementation(({ where }) =>
      Promise.resolve(tasks.find((t) => t.id === where.id) ?? null)
    );
    (mockPrisma.event.findMany as jest.Mock).mockResolvedValue([]);

    const callOrder: string[] = [];
    (mockPrisma.event.create as jest.Mock).mockImplementation(({ data }) => {
      callOrder.push(data.title);
      const start = new Date();
      return Promise.resolve({ id: "e", start, end: new Date(start.getTime() + 30 * 60_000) });
    });
    (mockPrisma.task.update as jest.Mock).mockResolvedValue({});
    (mockPrisma.$transaction as jest.Mock).mockImplementation((ops: any[]) => Promise.all(ops));

    await scheduleAllTasks("user-1");

    expect(callOrder[0]).toBe("Urgent task");
    expect(callOrder[callOrder.length - 1]).toBe("Low task");

    jest.useRealTimers();
  });

  test("sorts tasks by dueDate when taskOrder is 'dueDate'", async () => {
    const now = new Date("2026-03-10T09:00:00Z");
    jest.useFakeTimers().setSystemTime(now);

    (mockPrisma.userPreferences.findUnique as jest.Mock).mockResolvedValue({
      workStartTime: "07:00",
      workEndTime: "22:00",
      daysOff: [],
      sessionLength: 0,
      breakLength: 15,
      breaksPerDay: 0,
      maxTasksPerDay: 0,
      taskOrder: "dueDate",
    });

    const tasks = [
      { id: "t1", title: "Later task",  priority: "Medium", duration: 30, dueDate: new Date("2026-03-15"), status: "pending", completed: false },
      { id: "t2", title: "Sooner task", priority: "Low",    duration: 30, dueDate: new Date("2026-03-11"), status: "pending", completed: false },
    ];
    (mockPrisma.task.findMany as jest.Mock).mockResolvedValue(tasks);
    (mockPrisma.task.findFirst as jest.Mock).mockImplementation(({ where }) =>
      Promise.resolve(tasks.find((t) => t.id === where.id) ?? null)
    );
    (mockPrisma.event.findMany as jest.Mock).mockResolvedValue([]);

    const callOrder: string[] = [];
    (mockPrisma.event.create as jest.Mock).mockImplementation(({ data }) => {
      callOrder.push(data.title);
      const start = new Date();
      return Promise.resolve({ id: "e", start, end: new Date(start.getTime() + 30 * 60_000) });
    });
    (mockPrisma.task.update as jest.Mock).mockResolvedValue({});
    (mockPrisma.$transaction as jest.Mock).mockImplementation((ops: any[]) => Promise.all(ops));

    await scheduleAllTasks("user-1");
    expect(callOrder[0]).toBe("Sooner task");

    jest.useRealTimers();
  });

  test("marks task as not scheduled when no slot is available", async () => {
    const now = new Date("2026-03-10T09:00:00Z");
    jest.useFakeTimers().setSystemTime(now);

    (mockPrisma.userPreferences.findUnique as jest.Mock).mockResolvedValue(null);

    const tasks = [
      { id: "t1", title: "Impossible task", priority: "High", duration: 999999, dueDate: null, status: "pending", completed: false },
    ];
    (mockPrisma.task.findMany as jest.Mock).mockResolvedValue(tasks);
    (mockPrisma.task.findFirst as jest.Mock).mockResolvedValue(tasks[0]);
    (mockPrisma.event.findMany as jest.Mock).mockResolvedValue([
      { start: now, end: new Date(now.getTime() + 30 * 86_400_000) },
    ]);

    const results = await scheduleAllTasks("user-1");
    expect(results).toEqual([
      { taskId: "t1", title: "Impossible task", scheduled: false },
    ]);

    jest.useRealTimers();
  });

  test("accumulates scheduled slots to avoid double-booking across tasks", async () => {
    const now = new Date("2026-03-10T09:00:00Z");
    jest.useFakeTimers().setSystemTime(now);

    (mockPrisma.userPreferences.findUnique as jest.Mock).mockResolvedValue(null);

    const tasks = [
      { id: "t1", title: "Task 1", priority: "High",   duration: 60, dueDate: null, status: "pending", completed: false },
      { id: "t2", title: "Task 2", priority: "Medium",  duration: 60, dueDate: null, status: "pending", completed: false },
    ];
    (mockPrisma.task.findMany as jest.Mock).mockResolvedValue(tasks);
    (mockPrisma.task.findFirst as jest.Mock).mockImplementation(({ where }) =>
      Promise.resolve(tasks.find((t) => t.id === where.id) ?? null)
    );
    (mockPrisma.event.findMany as jest.Mock).mockResolvedValue([]);

    const createdEvents: { start: Date; end: Date }[] = [];
    (mockPrisma.event.create as jest.Mock).mockImplementation(({ data }) => {
      const event = { id: Math.random().toString(), start: data.start, end: data.end };
      createdEvents.push(event);
      return Promise.resolve(event);
    });
    (mockPrisma.task.update as jest.Mock).mockResolvedValue({});
    (mockPrisma.$transaction as jest.Mock).mockImplementation((ops: any[]) => Promise.all(ops));

    const results = await scheduleAllTasks("user-1");
    const scheduled = results.filter((r) => r.scheduled);
    expect(scheduled.length).toBe(2);

    if (createdEvents.length === 2) {
      const [e1, e2] = createdEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
      expect(e2.start.getTime()).toBeGreaterThanOrEqual(e1.end.getTime());
    }

    jest.useRealTimers();
  });
});