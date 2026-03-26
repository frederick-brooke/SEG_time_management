import { GET, POST, DELETE } from "../route";

// ── Mocks 

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

jest.mock("next-auth/next", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

const mockTaskUpdate = jest.fn();
const mockScheduleLogFindMany = jest.fn();
const mockScheduleLogFindFirst = jest.fn();
const mockScheduleLogCreate = jest.fn();
const mockScheduleLogDelete = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    task: { update: (...a: any[]) => mockTaskUpdate(...a) },
    scheduleLog: {
      findMany:  (...a: any[]) => mockScheduleLogFindMany(...a),
      findFirst: (...a: any[]) => mockScheduleLogFindFirst(...a),
      create:    (...a: any[]) => mockScheduleLogCreate(...a),
      delete:    (...a: any[]) => mockScheduleLogDelete(...a),
    },
  },
}));

import { getServerSession } from "next-auth/next";
const mockGetServerSession = getServerSession as jest.Mock;

// ── Helpers ────────

function makeRequest(body: object) {
  return { json: () => Promise.resolve(body) } as any;
}

function makeDeleteRequest(id?: string) {
  return { url: `http://localhost/api/schedule-log${id ? `?id=${id}` : ""}` } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ── GET ──

describe("GET /api/schedule-log — auth", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorised" });
  });
});

describe("GET /api/schedule-log — happy path", () => {
  beforeEach(() => mockGetServerSession.mockResolvedValue(mockSession));

  it("returns logs ordered by scheduledAt desc", async () => {
    const logs = [{ id: "log-1" }, { id: "log-2" }];
    mockScheduleLogFindMany.mockResolvedValue(logs);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ logs });
    expect(mockScheduleLogFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "user-1" },
      orderBy: { scheduledAt: "desc" },
    }));
  });

  it("returns empty logs array when findMany throws", async () => {
    mockScheduleLogFindMany.mockRejectedValue(new Error("Schema not migrated"));
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ logs: [] });
  });
});

// ── POST ─

describe("POST /api/schedule-log — auth", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await POST(makeRequest({ mode: "week", dateLabel: "Week schedule", taskIds: [] }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorised" });
  });
});

describe("POST /api/schedule-log — happy path", () => {
  beforeEach(() => mockGetServerSession.mockResolvedValue(mockSession));

  it("creates a log entry and returns it", async () => {
    const log = { id: "log-1", mode: "week" };
    mockScheduleLogCreate.mockResolvedValue(log);
    const res = await POST(makeRequest({ mode: "week", dateLabel: "Week schedule", taskIds: ["t1"] }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ log });
  });

  it("passes correct fields to prisma.scheduleLog.create", async () => {
    mockScheduleLogCreate.mockResolvedValue({});
    await POST(makeRequest({
      mode: "day",
      dateLabel: "My Label",
      taskIds: ["t1", "t2"],
      previousSchedule: { "t1": { scheduledDate: null, scheduledTime: null } },
      days: ["2025-01-06"],
    }));
    expect(mockScheduleLogCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: "user-1",
        mode: "day",
        dateLabel: "My Label",
        taskIds: ["t1", "t2"],
        previousSchedule: { "t1": { scheduledDate: null, scheduledTime: null } },
        days: ["2025-01-06"],
      }),
    }));
  });

  it("defaults taskIds to [] when not provided", async () => {
    mockScheduleLogCreate.mockResolvedValue({});
    await POST(makeRequest({ mode: "day", dateLabel: "Label" }));
    expect(mockScheduleLogCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ taskIds: [] }),
    }));
  });

  it("defaults previousSchedule to null when not provided", async () => {
    mockScheduleLogCreate.mockResolvedValue({});
    await POST(makeRequest({ mode: "day", dateLabel: "Label" }));
    expect(mockScheduleLogCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ previousSchedule: null }),
    }));
  });

  it("defaults days to null when not provided", async () => {
    mockScheduleLogCreate.mockResolvedValue({});
    await POST(makeRequest({ mode: "day", dateLabel: "Label" }));
    expect(mockScheduleLogCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ days: null }),
    }));
  });
});

// ── DELETE ─────────

describe("DELETE /api/schedule-log — auth", () => {
  it("returns 401 when unauthenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await DELETE(makeDeleteRequest("log-1"));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorised" });
  });
});

describe("DELETE /api/schedule-log — validation", () => {
  beforeEach(() => mockGetServerSession.mockResolvedValue(mockSession));

  it("returns 400 when id query param is missing", async () => {
    const res = await DELETE(makeDeleteRequest());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Log ID required" });
  });

  it("returns 404 when log is not found or does not belong to user", async () => {
    mockScheduleLogFindFirst.mockResolvedValue(null);
    const res = await DELETE(makeDeleteRequest("log-999"));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Log not found" });
  });
});

describe("DELETE /api/schedule-log — happy path", () => {
  beforeEach(() => mockGetServerSession.mockResolvedValue(mockSession));

  it("returns success true", async () => {
    mockScheduleLogFindFirst.mockResolvedValue({ id: "log-1", taskIds: [], previousSchedule: null });
    mockScheduleLogDelete.mockResolvedValue({});
    const res = await DELETE(makeDeleteRequest("log-1"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });

  it("deletes the log after restoring tasks", async () => {
    mockScheduleLogFindFirst.mockResolvedValue({ id: "log-1", taskIds: ["t1"], previousSchedule: null });
    mockTaskUpdate.mockResolvedValue({});
    mockScheduleLogDelete.mockResolvedValue({});
    await DELETE(makeDeleteRequest("log-1"));
    expect(mockScheduleLogDelete).toHaveBeenCalledWith({ where: { id: "log-1" } });
  });

  it("restores each task using snapshot values", async () => {
    const snapshot = {
      "t1": { scheduledDate: "2025-01-01T00:00:00.000Z", scheduledTime: "2025-01-01T09:00:00.000Z" },
      "t2": { scheduledDate: null, scheduledTime: null },
    };
    mockScheduleLogFindFirst.mockResolvedValue({ id: "log-1", taskIds: ["t1", "t2"], previousSchedule: snapshot });
    mockTaskUpdate.mockResolvedValue({});
    mockScheduleLogDelete.mockResolvedValue({});
    await DELETE(makeDeleteRequest("log-1"));
    expect(mockTaskUpdate).toHaveBeenCalledTimes(2);
    expect(mockTaskUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "t1" },
      data: expect.objectContaining({
        scheduledDate: new Date("2025-01-01T00:00:00.000Z"),
        scheduledTime: new Date("2025-01-01T09:00:00.000Z"),
      }),
    }));
    expect(mockTaskUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "t2" },
      data: expect.objectContaining({ scheduledDate: null, scheduledTime: null }),
    }));
  });

  it("handles null previousSchedule by restoring all tasks to null", async () => {
    mockScheduleLogFindFirst.mockResolvedValue({ id: "log-1", taskIds: ["t1"], previousSchedule: null });
    mockTaskUpdate.mockResolvedValue({});
    mockScheduleLogDelete.mockResolvedValue({});
    await DELETE(makeDeleteRequest("log-1"));
    expect(mockTaskUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "t1" },
      data: expect.objectContaining({ scheduledDate: null, scheduledTime: null }),
    }));
  });

  it("scopes findFirst to the current user", async () => {
    mockScheduleLogFindFirst.mockResolvedValue({ id: "log-1", taskIds: [], previousSchedule: null });
    mockScheduleLogDelete.mockResolvedValue({});
    await DELETE(makeDeleteRequest("log-1"));
    expect(mockScheduleLogFindFirst).toHaveBeenCalledWith({ where: { id: "log-1", userId: "user-1" } });
  });
});