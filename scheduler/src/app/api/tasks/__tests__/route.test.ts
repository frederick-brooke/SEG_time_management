/**
 * Testing for tasks api route.
 */

import { GET, POST } from "@/app/api/tasks/route";
import { prisma } from "@/lib/prisma";
import { addDays, addMonths } from "date-fns";

// Mocks

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    })),
  },
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
    },
    exam: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("date-fns", () => {
  const actual = jest.requireActual("date-fns");
  return {
    ...actual,
    addDays: jest.fn(actual.addDays),
    addWeeks: jest.fn(actual.addWeeks),
    addMonths: jest.fn(actual.addMonths),
  };
});

const mockFindMany = prisma.task.findMany as jest.Mock;
const mockCreate = prisma.task.create as jest.Mock;
const mockEventFindUnique = prisma.event.findUnique as jest.Mock;
const mockExamFindUnique = prisma.exam.findUnique as jest.Mock;

// Helpers

function makeRequest(url: string): Request {
  return { url } as unknown as Request;
}

function makePostRequest(body: unknown): Request {
  return {
    json: async () => body,
  } as unknown as Request;
}

// Tests

// GET
describe("GET /api/tasks", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns 400 when userId is missing", async () => {
    const req = makeRequest("http://localhost/api/tasks");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("User ID required");
  });

  test("returns tasks for a valid userId", async () => {
    const fakeTasks = [{ id: "t1", title: "Test task" }];
    mockFindMany.mockResolvedValue(fakeTasks);

    const req = makeRequest("http://localhost/api/tasks?userId=user1");
    const res = await GET(req);
    const json = await res.json();

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { userId: "user1" },
      include: { exam: true, event: true },
      orderBy: { createdAt: "desc" },
    });
    expect(json.tasks).toEqual(fakeTasks);
  });

  test("returns 500 on database error", async () => {
    mockFindMany.mockRejectedValue(new Error("DB error"));
    const req = makeRequest("http://localhost/api/tasks?userId=user1");
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});

// POST
describe("POST /api/tasks — single task", () => {
  beforeEach(() => jest.clearAllMocks());

  test("creates a task with all fields populated", async () => {
    const createdTask = { id: "t1", title: "My Task", exam: null };
    mockCreate.mockResolvedValue(createdTask);
    mockExamFindUnique.mockResolvedValue(null);

    const body = {
      title: "My Task",
      description: "desc",
      dueDate: "2025-06-01",
      userId: "user1",
      priority: "High",
      duration: 90,
      subtasks: [{ title: "sub1" }],
      examId: "none",
      eventId: "evt1",
      isRecurring: true,
      recurrence: { type: "daily" },
      scheduledDate: "2025-06-01",
      scheduledTime: "2025-06-01T10:00:00",
      bufferDays: 2,
      url: "https://example.com",
      scheduledRelativeTo: "event",
      relativeOffsetDays: -1,
      eventLinkMode: "before",
    };

    const req = makePostRequest(body);
    const res = await POST(req);
    const json = await res.json();

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "My Task",
          priority: "High",
          category: "General",
          examId: null,
        }),
      })
    );
    expect(json.task.id).toBe("t1");
  });

  test("fetches exam category when valid examId is provided", async () => {
    mockExamFindUnique.mockResolvedValue({ id: "exam1", title: "Maths Final" });
    mockCreate.mockResolvedValue({ id: "t2", exam: { title: "Maths Final" } });

    const body = { title: "Revision", userId: "user1", examId: "exam1" };
    const req = makePostRequest(body);
    await POST(req);

    expect(mockExamFindUnique).toHaveBeenCalledWith({ where: { id: "exam1" } });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ category: "Maths Final" }),
      })
    );
  });

  test("uses 'General' category when exam is not found", async () => {
    mockExamFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "t3", exam: null });

    const body = { title: "Orphan Task", userId: "user1", examId: "missing-exam" };
    const req = makePostRequest(body);
    await POST(req);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ category: "General" }),
      })
    );
  });

  test("uses default values when optional fields are omitted", async () => {
    mockCreate.mockResolvedValue({ id: "t4", exam: null });

    const body = { title: "Minimal Task", userId: "user1" };
    const req = makePostRequest(body);
    await POST(req);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          priority: "Medium",
          duration: 0,
          subtasks: [],
          isRecurring: false,
          completed: false,
          completedAt: null,
          scheduledDate: null,
          scheduledTime: null,
          dueDate: null,
          description: null,
          examId: null,
          eventId: null,
          recurrence: null,
          bufferDays: null,
          url: null,
          scheduledRelativeTo: null,
          relativeOffsetDays: null,
          eventLinkMode: null,
        }),
      })
    );
  });

  test("returns 500 on database error", async () => {
    mockCreate.mockRejectedValue(new Error("DB error"));
    const req = makePostRequest({ title: "Task", userId: "user1" });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

describe("POST /api/tasks — bulk creation", () => {
  beforeEach(() => jest.clearAllMocks());

  test("creates multiple tasks and returns them all", async () => {
    const t1 = { id: "t1", title: "Task A" };
    const t2 = { id: "t2", title: "Task B" };
    mockCreate.mockResolvedValueOnce(t1).mockResolvedValueOnce(t2);

    const body = {
      tasks: [
        { title: "Task A", userId: "u1" },
        { title: "Task B", userId: "u1" },
      ],
    };

    const req = makePostRequest(body);
    const res = await POST(req);
    const json = await res.json();

    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(json.tasks).toHaveLength(2);
    expect(json.tasks[0].id).toBe("t1");
  });

  test("bulk: sets scheduledDate and scheduledTime when relativeMode=custom + scheduleTime=true", async () => {
    mockCreate.mockResolvedValue({ id: "t1" });

    const body = {
      tasks: [
        {
          title: "Custom Date Task",
          userId: "u1",
          relativeMode: "custom",
          customDate: "2025-08-15",
          scheduleTime: true,
          specificTime: "09:30",
        },
      ],
    };

    const req = makePostRequest(body);
    await POST(req);

    const data = mockCreate.mock.calls[0][0].data;
    expect(data.scheduledDate).not.toBeNull();
    expect(data.scheduledTime).not.toBeNull();

    const st = data.scheduledTime as Date;
    expect(st.getHours()).toBe(9);
    expect(st.getMinutes()).toBe(30);
  });

  test("bulk: clears scheduledDate/Time when relativeMode=custom + scheduleTime=false", async () => {
    mockCreate.mockResolvedValue({ id: "t1" });

    const body = {
      tasks: [
        {
          title: "Custom No Time",
          userId: "u1",
          relativeMode: "custom",
          customDate: "2025-08-15",
          scheduleTime: false,
        },
      ],
    };

    const req = makePostRequest(body);
    await POST(req);

    const data = mockCreate.mock.calls[0][0].data;
    expect(data.scheduledDate).toBeNull();
    expect(data.scheduledTime).toBeNull();
  });

  test("bulk: uses customRangeStart as fallback when customDate is absent", async () => {
    mockCreate.mockResolvedValue({ id: "t1" });

    const body = {
      tasks: [
        {
          title: "Range Task",
          userId: "u1",
          relativeMode: "custom",
          customRangeStart: "2025-09-01",
          scheduleTime: true,
          specificTime: "14:00",
        },
      ],
    };

    const req = makePostRequest(body);
    await POST(req);

    const data = mockCreate.mock.calls[0][0].data;
    expect(data.scheduledDate).not.toBeNull();
    const d = data.scheduledDate as Date;
    expect(d.getMonth()).toBe(8);
  });

  test("bulk: computes date from non-recurring event + relativeOffsetDays", async () => {
    const eventStart = new Date("2025-10-10");
    mockEventFindUnique.mockResolvedValue({
      id: "evt1",
      start: eventStart.toISOString(),
      recurrence: null,
    });
    mockCreate.mockResolvedValue({ id: "t1" });

    const body = {
      tasks: [
        {
          title: "Pre-event Task",
          userId: "u1",
          eventId: "evt1",
          relativeOffsetDays: -2,
          scheduleTime: true,
          specificTime: "08:00",
        },
      ],
    };

    const req = makePostRequest(body);
    await POST(req);

    const data = mockCreate.mock.calls[0][0].data;
    const sd = data.scheduledDate as Date;
    expect(sd.getDate()).toBe(8);
    expect(sd.getMonth()).toBe(9);
  });

  test("bulk: skips event lookup when eventId is absent even with relativeOffsetDays", async () => {
    mockCreate.mockResolvedValue({ id: "t1" });

    const body = {
      tasks: [
        {
          title: "No Event",
          userId: "u1",
          relativeOffsetDays: -1,
        },
      ],
    };

    const req = makePostRequest(body);
    await POST(req);

    expect(mockEventFindUnique).not.toHaveBeenCalled();
    const data = mockCreate.mock.calls[0][0].data;
    expect(data.scheduledDate).toBeNull();
  });

  test("bulk: handles event not found in DB gracefully", async () => {
    mockEventFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "t1" });

    const body = {
      tasks: [
        {
          title: "Ghost Event Task",
          userId: "u1",
          eventId: "nonexistent",
          relativeOffsetDays: 0,
        },
      ],
    };

    const req = makePostRequest(body);
    await POST(req);

    const data = mockCreate.mock.calls[0][0].data;
    expect(data.scheduledDate).toBeNull();
  });

  test("bulk: sets scheduledDate from recurrence.startDate for recurring task", async () => {
    mockCreate.mockResolvedValue({ id: "t1" });

    const body = {
      tasks: [
        {
          title: "Recurring Task",
          userId: "u1",
          isRecurring: true,
          recurrence: { startDate: "2025-11-01", type: "weekly" },
          scheduleTime: true,
          specificTime: "07:00",
        },
      ],
    };

    const req = makePostRequest(body);
    await POST(req);

    const data = mockCreate.mock.calls[0][0].data;
    expect(data.scheduledDate).not.toBeNull();
    const sd = data.scheduledDate as Date;
    expect(sd.getMonth()).toBe(10);
    expect(sd.getDate()).toBe(1);
  });

  test("bulk: taskDate stays null when no date source is configured", async () => {
    mockCreate.mockResolvedValue({ id: "t1" });

    const body = {
      tasks: [
        {
          title: "Unscheduled",
          userId: "u1",
        },
      ],
    };

    const req = makePostRequest(body);
    await POST(req);

    const data = mockCreate.mock.calls[0][0].data;
    expect(data.scheduledDate).toBeNull();
    expect(data.scheduledTime).toBeNull();
  });

  test("bulk: returns 500 on database error", async () => {
    mockCreate.mockRejectedValue(new Error("DB error"));

    const body = {
      tasks: [{ title: "Fail Task", userId: "u1" }],
    };

    const req = makePostRequest(body);
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});


describe("computeTaskDateFromEvent — recurrence branches", () => {
  beforeEach(() => jest.clearAllMocks());

  // Helper to call POST with a single event-linked task and return the
  // scheduledDate that was written to prisma.task.create.
  async function getScheduledDateForEvent(event: object, offsetDays = 0): Promise<Date | null> {
    mockEventFindUnique.mockResolvedValue(event);
    mockCreate.mockResolvedValue({ id: "t1" });

    const body = {
      tasks: [
        {
          title: "T",
          userId: "u1",
          eventId: "evt1",
          relativeOffsetDays: offsetDays,
          scheduleTime: true,
          specificTime: "12:00",
        },
      ],
    };

    await POST(makePostRequest(body));
    return mockCreate.mock.calls[0][0].data.scheduledDate as Date | null;
  }

  test("non-recurring event: returns event start + offset", async () => {
    // Use local noon so setHours(0,0,0,0) always lands on the same calendar
    // date regardless of the test runner's UTC offset.
    const base = new Date(2025, 6, 20, 12, 0, 0); // July 20 noon
    const event = { id: "evt1", start: base.toISOString(), recurrence: { type: "none" } };
    const date = await getScheduledDateForEvent(event, -3);
    expect(date).not.toBeNull();
    expect(date!.getDate()).toBe(17);
    expect(date!.getMonth()).toBe(6);
  });

  test("null recurrence treated as non-recurring", async () => {
    const base = new Date(2025, 6, 20, 12, 0, 0); // July 20 noon
    const event = { id: "evt1", start: base.toISOString(), recurrence: null };
    const date = await getScheduledDateForEvent(event, 0);
    expect(date).not.toBeNull();
    expect(date!.getDate()).toBe(20);
    expect(date!.getMonth()).toBe(6);
  });

  test("daily recurrence: returns next occurrence >= today + offset", async () => {
    // Use a past start so the loop must advance to find today or later.
    const pastStart = addDays(new Date(), -5);
    const event = {
      id: "evt1",
      start: pastStart.toISOString(),
      recurrence: { type: "daily", until: null },
    };
    const date = await getScheduledDateForEvent(event, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(date!.getTime()).toBeGreaterThanOrEqual(today.getTime());
  });

  test("monthly recurrence: returns next occurrence >= today + offset", async () => {
    const pastStart = addMonths(new Date(), -2);
    const event = {
      id: "evt1",
      start: pastStart.toISOString(),
      recurrence: { type: "monthly", until: null },
    };
    const date = await getScheduledDateForEvent(event, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(date!.getTime()).toBeGreaterThanOrEqual(today.getTime());
  });

  test("weekly recurrence: returns the soonest matching weekday + offset", async () => {
    // Start a week in the past so the loop needs at least one iteration.
    const pastStart = addDays(new Date(), -7);
    const event = {
      id: "evt1",
      start: pastStart.toISOString(),
      recurrence: {
        type: "weekly",
        days: ["Mon", "Wed", "Fri"],
        until: null,
      },
    };
    const date = await getScheduledDateForEvent(event, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(date!.getTime()).toBeGreaterThanOrEqual(today.getTime());
  });

  test("weekly recurrence with no matching days returns fallback", async () => {
    const yesterday = addDays(new Date(), -1);
    const event = {
      id: "evt1",
      start: yesterday.toISOString(),
      recurrence: {
        type: "weekly",
        days: ["Mon"],
        until: yesterday.toISOString(),
      },
    };
    const date = await getScheduledDateForEvent(event, 0);
    expect(date).not.toBeNull();
    expect(date).toBeInstanceOf(Date);
  });

  test("weekly with empty days array hits fallback/break", async () => {
    const event = {
      id: "evt1",
      start: new Date().toISOString(),
      recurrence: {
        type: "weekly",
        days: [],
        until: null,
      },
    };
    const date = await getScheduledDateForEvent(event, 0);
    expect(date).not.toBeNull();
    expect(date).toBeInstanceOf(Date);
  });

  test("unknown recurrence type hits break / fallback", async () => {
    const event = {
      id: "evt1",
      start: new Date().toISOString(),
      recurrence: { type: "unknown_type", until: null },
    };
    const date = await getScheduledDateForEvent(event, 0);
    expect(date).not.toBeNull();
    expect(date).toBeInstanceOf(Date);
  });

  test("relativeOffsetDays:null skips event branch (scheduledDate stays null)", async () => {
    mockCreate.mockResolvedValue({ id: "t1" });

    const body = {
      tasks: [
        {
          title: "Null Offset",
          userId: "u1",
          eventId: "evt1",
          relativeOffsetDays: null,
          scheduleTime: true,
          specificTime: "12:00",
        },
      ],
    };

    await POST(makePostRequest(body));
    const data = mockCreate.mock.calls[0][0].data;
    expect(data.scheduledDate).toBeNull();
    expect(mockEventFindUnique).not.toHaveBeenCalled();
  });

  test("relativeOffsetDays:0 passes 0 into computeTaskDateFromEvent (no offset applied)", async () => {
    const base = new Date(2025, 11, 25, 12, 0, 0); // Dec 25 noon
    const event = { id: "evt1", start: base.toISOString(), recurrence: { type: "none" } };
    mockEventFindUnique.mockResolvedValue(event);
    mockCreate.mockResolvedValue({ id: "t1" });

    const body = {
      tasks: [
        {
          title: "Zero Offset",
          userId: "u1",
          eventId: "evt1",
          relativeOffsetDays: 0,
          scheduleTime: true,
          specificTime: "12:00",
        },
      ],
    };

    await POST(makePostRequest(body));
    const sd = mockCreate.mock.calls[0][0].data.scheduledDate as Date;
    expect(sd.getDate()).toBe(25);
    expect(sd.getMonth()).toBe(11);
  });
});