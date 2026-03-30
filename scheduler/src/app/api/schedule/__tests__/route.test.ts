/**
 * Testing for schedule api route.
 */

import { POST } from "../route";

// Mocks

const mockSession = { user: { id: "user-1" } };

jest.mock("next/server", () => ({
    NextRequest: jest.fn(),
    NextResponse: {
      json: (body: any, init?: { status?: number }) => ({
        status: init?.status ?? 200,
        json: () => Promise.resolve(body),
      }),
    },
  }));

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({ authOptions: {} }));

const mockTaskUpdate = jest.fn();
const mockTaskFindMany = jest.fn();
const mockPrefsFindUnique = jest.fn();
const mockEventFindMany = jest.fn();
const mockScheduleLogCreate = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    task: { findMany: (...a: any[]) => mockTaskFindMany(...a), update: (...a: any[]) => mockTaskUpdate(...a) },
    userPreferences: { findUnique: (...a: any[]) => mockPrefsFindUnique(...a) },
    event: { findMany: (...a: any[]) => mockEventFindMany(...a) },
    scheduleLog: { create: (...a: any[]) => mockScheduleLogCreate(...a) },
  },
}));

const mockScheduleTasks = jest.fn();
jest.mock("@/lib/scheduling/scheduler", () => ({
  scheduleTasks: (...a: any[]) => mockScheduleTasks(...a),
}));

import { getServerSession } from "next-auth/next";
const mockGetServerSession = getServerSession as jest.Mock;

// Helpers

function makeRequest(body: object) {
    return { json: () => Promise.resolve(body) } as any;
  }

const basePrefs = {
  workStartTime: "09:00",
  workEndTime: "17:00",
  daysOff: [],
  sessionLength: 90,
  breakLength: 15,
  taskOrder: "priority",
};

const baseTasks = [
  { id: "task-1", title: "Task 1", scheduledDate: null, scheduledTime: null, eventId: null },
  { id: "task-2", title: "Task 2", scheduledDate: null, scheduledTime: null, eventId: null },
];

const baseScheduleResult = {
  scheduled: [
    { taskId: "task-1", scheduledDate: new Date("2025-01-06"), scheduledTime: new Date("2025-01-06T09:00:00") },
    { taskId: "task-2", scheduledDate: new Date("2025-01-07"), scheduledTime: new Date("2025-01-07T09:00:00") },
  ],
  overCapacity: [],
  missedDeadline: [],
};

function setupHappyPath() {
  mockGetServerSession.mockResolvedValue(mockSession);
  mockTaskFindMany.mockResolvedValue(baseTasks);
  mockPrefsFindUnique.mockResolvedValue(basePrefs);
  mockEventFindMany.mockResolvedValue([]);
  mockScheduleTasks.mockReturnValue(baseScheduleResult);
  mockTaskUpdate.mockResolvedValue({});
  mockScheduleLogCreate.mockResolvedValue({});
}

beforeEach(() => {
    jest.clearAllMocks();
  });

// Tests

describe("POST /api/schedule — auth", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await POST(makeRequest({ taskIds: ["t1"], days: ["2025-01-06"], mode: "day" }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorised" });
  });
});


describe("POST /api/schedule — validation", () => {
  beforeEach(() => mockGetServerSession.mockResolvedValue(mockSession));

  it("returns 400 when days is missing", async () => {
    const res = await POST(makeRequest({ taskIds: ["t1"], mode: "day" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "days required" });
  });

  it("returns 400 when days is empty", async () => {
    const res = await POST(makeRequest({ taskIds: ["t1"], days: [], mode: "day" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "days required" });
  });

  it("returns empty result when taskIds is missing", async () => {
    const res = await POST(makeRequest({ days: ["2025-01-06"], mode: "day" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ scheduled: 0, overCapacity: [], missedDeadline: [], requiresConfirmation: false });
  });

  it("returns empty result when taskIds is empty array", async () => {
    const res = await POST(makeRequest({ taskIds: [], days: ["2025-01-06"], mode: "day" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ scheduled: 0, overCapacity: [], missedDeadline: [], requiresConfirmation: false });
  });

  it("returns 400 when preferences not found", async () => {
    mockTaskFindMany.mockResolvedValue(baseTasks);
    mockPrefsFindUnique.mockResolvedValue(null);
    mockEventFindMany.mockResolvedValue([]);
    const res = await POST(makeRequest({ taskIds: ["task-1"], days: ["2025-01-06"], mode: "day" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "User preferences not found" });
  });
});


describe("POST /api/schedule — happy path", () => {
  beforeEach(setupHappyPath);

  it("returns scheduled count and empty overCapacity", async () => {
    const res = await POST(makeRequest({ taskIds: ["task-1", "task-2"], days: ["2025-01-06", "2025-01-07"], mode: "week" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ scheduled: 2, overCapacity: [], missedDeadline: [], requiresConfirmation: false });
  });

  it("persists each scheduled task via prisma.task.update", async () => {
    await POST(makeRequest({ taskIds: ["task-1", "task-2"], days: ["2025-01-06", "2025-01-07"], mode: "week" }));
    expect(mockTaskUpdate).toHaveBeenCalledTimes(2);
    expect(mockTaskUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "task-1" } }));
    expect(mockTaskUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "task-2" } }));
  });

  it("creates a schedule log entry", async () => {
    await POST(makeRequest({ taskIds: ["task-1", "task-2"], days: ["2025-01-06", "2025-01-07"], mode: "week" }));
    expect(mockScheduleLogCreate).toHaveBeenCalledTimes(1);
    expect(mockScheduleLogCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: "user-1", mode: "week" }),
    }));
  });

  it("uses custom dateLabel when provided", async () => {
    await POST(makeRequest({ taskIds: ["task-1"], days: ["2025-01-06"], mode: "day", dateLabel: "My Label" }));
    expect(mockScheduleLogCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ dateLabel: "My Label" }),
    }));
  });

  it("defaults dateLabel to 'Day schedule' in day mode", async () => {
    mockScheduleTasks.mockReturnValue({ ...baseScheduleResult, scheduled: [baseScheduleResult.scheduled[0]] });
    await POST(makeRequest({ taskIds: ["task-1"], days: ["2025-01-06"], mode: "day" }));
    expect(mockScheduleLogCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ dateLabel: "Day schedule" }),
    }));
  });

  it("defaults dateLabel to 'Week schedule' in week mode", async () => {
    await POST(makeRequest({ taskIds: ["task-1", "task-2"], days: ["2025-01-06", "2025-01-07"], mode: "week" }));
    expect(mockScheduleLogCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ dateLabel: "Week schedule" }),
    }));
  });

  it("includes days and previousSchedule in log", async () => {
    await POST(makeRequest({ taskIds: ["task-1", "task-2"], days: ["2025-01-06", "2025-01-07"], mode: "week" }));
    expect(mockScheduleLogCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        days: ["2025-01-06", "2025-01-07"],
        previousSchedule: expect.any(Object),
      }),
    }));
  });

  it("snapshots previous scheduledDate/scheduledTime as ISO strings", async () => {
    const prevDate = new Date("2025-01-01T00:00:00Z");
    const prevTime = new Date("2025-01-01T09:00:00Z");
    mockTaskFindMany.mockResolvedValue([
      { id: "task-1", title: "Task 1", scheduledDate: prevDate, scheduledTime: prevTime, eventId: null },
    ]);
    mockScheduleTasks.mockReturnValue({ scheduled: [baseScheduleResult.scheduled[0]], overCapacity: [], missedDeadline: [] });
    await POST(makeRequest({ taskIds: ["task-1"], days: ["2025-01-06"], mode: "day" }));
    expect(mockScheduleLogCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        previousSchedule: {
          "task-1": { scheduledDate: prevDate.toISOString(), scheduledTime: prevTime.toISOString() },
        },
      }),
    }));
  });

  it("passes scheduledTime as Date to prisma when already a Date", async () => {
    await POST(makeRequest({ taskIds: ["task-1"], days: ["2025-01-06"], mode: "day" }));
    const call = mockTaskUpdate.mock.calls[0][0];
    expect(call.data.scheduledTime).toBeInstanceOf(Date);
  });

  it("converts scheduledTime string to Date for prisma", async () => {
    mockScheduleTasks.mockReturnValue({
      scheduled: [{ taskId: "task-1", scheduledDate: new Date("2025-01-06"), scheduledTime: "2025-01-06T09:00:00.000Z" }],
      overCapacity: [],
      missedDeadline: [],
    });
    await POST(makeRequest({ taskIds: ["task-1"], days: ["2025-01-06"], mode: "day" }));
    const call = mockTaskUpdate.mock.calls[0][0];
    expect(call.data.scheduledTime).toBeInstanceOf(Date);
  });
});


describe("POST /api/schedule — breakOverrides", () => {
  beforeEach(setupHappyPath);

  it("merges breakOverrides into preferences passed to scheduleTasks", async () => {
    await POST(makeRequest({
      taskIds: ["task-1"], days: ["2025-01-06"], mode: "day",
      breakOverrides: { sessionLength: 45, breakLength: 10 },
    }));
    const passedPrefs = mockScheduleTasks.mock.calls[0][2];
    expect(passedPrefs.sessionLength).toBe(45);
    expect(passedPrefs.breakLength).toBe(10);
  });

  it("does not pass extra breakOverride keys to scheduleTasks", async () => {
    await POST(makeRequest({
      taskIds: ["task-1"], days: ["2025-01-06"], mode: "day",
      breakOverrides: { sessionLength: 45, breakLength: 10, extraKey: "should-not-appear" },
    }));
    const passedPrefs = mockScheduleTasks.mock.calls[0][2];
    expect(passedPrefs).not.toHaveProperty("extraKey");
  });

  it("uses original preferences when no breakOverrides provided", async () => {
    await POST(makeRequest({ taskIds: ["task-1"], days: ["2025-01-06"], mode: "day" }));
    const passedPrefs = mockScheduleTasks.mock.calls[0][2];
    expect(passedPrefs.sessionLength).toBe(90);
    expect(passedPrefs.breakLength).toBe(15);
  });
});


describe("POST /api/schedule — over capacity", () => {
  beforeEach(() => {
    setupHappyPath();
    mockScheduleTasks.mockReturnValue({
      scheduled: [baseScheduleResult.scheduled[0]],
      overCapacity: [{ taskId: "task-2", title: "Task 2" }],
      missedDeadline: [],
    });
  });

  it("returns requiresConfirmation without saving when over capacity", async () => {
    const res = await POST(makeRequest({ taskIds: ["task-1", "task-2"], days: ["2025-01-06"], mode: "day" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.requiresConfirmation).toBe(true);
    expect(body.scheduled).toBe(0);
    expect(body.wouldSchedule).toBe(1);
    expect(body.overCapacity).toEqual([{ taskId: "task-2", title: "Task 2" }]);
  });

  it("does not persist tasks when over capacity and not confirmed", async () => {
    await POST(makeRequest({ taskIds: ["task-1", "task-2"], days: ["2025-01-06"], mode: "day" }));
    expect(mockTaskUpdate).not.toHaveBeenCalled();
    expect(mockScheduleLogCreate).not.toHaveBeenCalled();
  });

  it("proceeds and saves when ignoreCapacity is true", async () => {
    const res = await POST(makeRequest({ taskIds: ["task-1", "task-2"], days: ["2025-01-06"], mode: "day", ignoreCapacity: true }));
    const body = await res.json();
    expect(body.requiresConfirmation).toBe(false);
    expect(mockTaskUpdate).toHaveBeenCalled();
    expect(mockScheduleLogCreate).toHaveBeenCalled();
  });
});


describe("POST /api/schedule — missed deadlines", () => {
  beforeEach(() => {
    setupHappyPath();
    mockScheduleTasks.mockReturnValue({
      scheduled: [baseScheduleResult.scheduled[0]],
      overCapacity: [],
      missedDeadline: [{ taskId: "task-2", title: "Task 2" }],
    });
  });

  it("includes missedDeadline in response", async () => {
    const res = await POST(makeRequest({ taskIds: ["task-1", "task-2"], days: ["2025-01-06"], mode: "day" }));
    const body = await res.json();
    expect(body.missedDeadline).toEqual([{ taskId: "task-2", title: "Task 2" }]);
  });

  it("still persists successfully scheduled tasks", async () => {
    await POST(makeRequest({ taskIds: ["task-1", "task-2"], days: ["2025-01-06"], mode: "day" }));
    expect(mockTaskUpdate).toHaveBeenCalledTimes(1);
  });
});


describe("POST /api/schedule — linked events", () => {
  beforeEach(setupHappyPath);

  it("fetches linked events not in the window and passes allEvents to scheduleTasks", async () => {
    const linkedEvent = { id: "event-99", start: new Date(), end: new Date() };
    mockTaskFindMany.mockResolvedValue([
      { id: "task-1", title: "Task 1", scheduledDate: null, scheduledTime: null, eventId: "event-99" },
    ]);
    mockEventFindMany
      .mockResolvedValueOnce([]) // windowEvents
      .mockResolvedValueOnce([linkedEvent]); // allEvents

    mockScheduleTasks.mockReturnValue({ scheduled: [baseScheduleResult.scheduled[0]], overCapacity: [], missedDeadline: [] });

    await POST(makeRequest({ taskIds: ["task-1"], days: ["2025-01-06"], mode: "day" }));

    const allEvents = mockScheduleTasks.mock.calls[0][4];
    expect(allEvents).toContainEqual(linkedEvent);
  });

  it("does not double-fetch events already in the window", async () => {
    const windowEvent = { id: "event-99", start: new Date(), end: new Date() };
    mockTaskFindMany.mockResolvedValue([
      { id: "task-1", title: "Task 1", scheduledDate: null, scheduledTime: null, eventId: "event-99" },
    ]);
    mockEventFindMany.mockResolvedValueOnce([windowEvent]); // event-99 already in window
    mockScheduleTasks.mockReturnValue({ scheduled: [baseScheduleResult.scheduled[0]], overCapacity: [], missedDeadline: [] });

    await POST(makeRequest({ taskIds: ["task-1"], days: ["2025-01-06"], mode: "day" }));

    expect(mockEventFindMany).toHaveBeenCalledTimes(1);
  });
});


describe("POST /api/schedule — schedule log fallback", () => {
  beforeEach(setupHappyPath);

  it("retries log creation without previousSchedule/days on Unknown argument error", async () => {
    mockScheduleLogCreate
      .mockRejectedValueOnce(new Error("Unknown argument `previousSchedule`"))
      .mockResolvedValueOnce({});

    const res = await POST(makeRequest({ taskIds: ["task-1", "task-2"], days: ["2025-01-06", "2025-01-07"], mode: "week" }));
    expect(res.status).toBe(200);
    expect(mockScheduleLogCreate).toHaveBeenCalledTimes(2);

    const fallbackCall = mockScheduleLogCreate.mock.calls[1][0];
    expect(fallbackCall.data).not.toHaveProperty("previousSchedule");
    expect(fallbackCall.data).not.toHaveProperty("days");
  });

  it("re-throws non-Unknown-argument errors from log creation", async () => {
    mockScheduleLogCreate.mockRejectedValue(new Error("DB connection failed"));
    await expect(
      POST(makeRequest({ taskIds: ["task-1"], days: ["2025-01-06"], mode: "day" })),
    ).rejects.toThrow("DB connection failed");
  });
});


describe("POST /api/schedule — scheduleTasks call", () => {
  beforeEach(setupHappyPath);

  it("passes tasks, windowEvents, effectivePrefs, scheduleDays, allEvents to scheduleTasks", async () => {
    await POST(makeRequest({ taskIds: ["task-1", "task-2"], days: ["2025-01-06", "2025-01-07"], mode: "week" }));
    expect(mockScheduleTasks).toHaveBeenCalledWith(
      baseTasks,
      expect.any(Array), // windowEvents
      expect.objectContaining({ sessionLength: 90 }),
      expect.arrayContaining([expect.any(Date)]),
      expect.any(Array), // allEvents
    );
  });

  it("passes correct local midnight dates to scheduleTasks", async () => {
    await POST(makeRequest({ taskIds: ["task-1"], days: ["2025-01-06"], mode: "day" }));
    const scheduleDays = mockScheduleTasks.mock.calls[0][3];
    expect(scheduleDays[0].getHours()).toBe(0);
    expect(scheduleDays[0].getMinutes()).toBe(0);
    expect(scheduleDays[0].getSeconds()).toBe(0);
  });
});