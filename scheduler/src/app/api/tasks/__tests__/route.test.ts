import { DELETE, PATCH } from "@/app/api/tasks/[id]/route";
import { prisma } from "@/lib/prisma";
import { awardTaskPoints, revokeTaskPoints } from "@/lib/points";

jest.mock("@/lib/points", () => ({
  awardTaskPoints: jest.fn(),
  revokeTaskPoints: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      delete: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    exam: {
      findUnique: jest.fn(),
    },
  }
}));

// Typed mocks so TypeScript allows mockResolvedValue
const mockDelete = prisma.task.delete as jest.Mock;
const mockFindUnique = prisma.task.findUnique as jest.Mock;
const mockExamFindUnique = prisma.exam.findUnique as jest.Mock;
const mockUpdate = prisma.task.update as jest.Mock;
const mockAwardPoints = awardTaskPoints as jest.Mock;
const mockRevokePoints = revokeTaskPoints as jest.Mock;

describe("Task API Route", () => {
  const params = Promise.resolve({ id: "task1" });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ───────── DELETE ─────────

  test("DELETE successfully removes task", async () => {
    mockDelete.mockResolvedValue({});

    const res = await DELETE({} as Request, { params });
    const json = await res.json();

    expect(mockDelete).toHaveBeenCalledWith({
      where: { id: "task1" },
    });

    expect(json).toEqual({ success: true });
  });

  test("DELETE returns 500 on failure", async () => {
    mockDelete.mockRejectedValue(new Error("Database error"));

    const res = await DELETE({} as Request, { params });

    expect(res.status).toBe(500);
  });

  // ───────── PATCH ─────────

  test("PATCH returns 404 if task not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = {
      json: async () => ({ title: "Updated" }),
    } as unknown as Request;

    const res = await PATCH(req, { params });

    expect(res.status).toBe(404);
  });

  test("PATCH updates task normally", async () => {
    mockFindUnique.mockResolvedValue({
      id: "task1",
      completed: false,
    });

    mockUpdate.mockResolvedValue({
      id: "task1",
      userId: "user1",
      completed: false,
      priority: "Low",
    });

    const req = {
      json: async () => ({ title: "Updated Task" }),
    } as unknown as Request;

    const res = await PATCH(req, { params });
    const json = await res.json();

    expect(mockUpdate).toHaveBeenCalled();
    expect(json.task.id).toBe("task1");
  });

  test("PATCH completion awards points", async () => {
    mockFindUnique.mockResolvedValue({
      id: "task1",
      completed: false,
    });

    mockUpdate.mockResolvedValue({
      id: "task1",
      userId: "user1",
      completed: true,
      priority: "High",
    });

    const req = {
      json: async () => ({ status: "completed" }),
    } as unknown as Request;

    await PATCH(req, { params });

    expect(mockAwardPoints).toHaveBeenCalledWith(
      "user1",
      "task1",
      "High"
    );
  });

  test("PATCH un-completion revokes points", async () => {
    mockFindUnique.mockResolvedValue({
      id: "task1",
      completed: true,
    });

    mockUpdate.mockResolvedValue({
      id: "task1",
      userId: "user1",
      completed: false,
      priority: "Medium",
    });

    const req = {
      json: async () => ({ status: "todo" }),
    } as unknown as Request;

    await PATCH(req, { params });

    expect(mockRevokePoints).toHaveBeenCalledWith(
      "user1",
      "task1",
      "Medium"
    );
  });

  test("PATCH direct completed toggle", async () => {
    mockFindUnique.mockResolvedValue({
      id: "task1",
      completed: false,
    });

    mockUpdate.mockResolvedValue({
      id: "task1",
      userId: "user1",
      completed: true,
      priority: "Low",
    });

    const req = {
      json: async () => ({ completed: true }),
    } as unknown as Request;

    await PATCH(req, { params });

    expect(mockAwardPoints).toHaveBeenCalled();
  });

  test("PATCH returns 500 on server error", async () => {
    mockFindUnique.mockRejectedValue(new Error("Database error"));

    const req = {
      json: async () => ({}),
    } as unknown as Request;

    const res = await PATCH(req, { params });

    expect(res.status).toBe(500);
  });

  test("PATCH with examId links to exam", async () => {
    mockFindUnique
      .mockResolvedValueOnce({ id: "task1", completed: false })
      .mockResolvedValueOnce({ id: "exam1", title: "Maths Exam" });
    
    mockUpdate.mockResolvedValueOnce({
      id: "task1", userId: "user1", completed: false, priority: "Low"
    });

    const req = {
      json: async () => ({ examId: "exam1" }),
    } as unknown as Request;

    const res = await PATCH(req, { params });
    expect(res.status).not.toBe(500);
  });

  test("PATCH with examId none clears exam", async () => {
    mockFindUnique.mockResolvedValue({ id: "task1", completed: false });
    mockUpdate.mockResolvedValue({
      id: "task1", userId: "user1", completed: false, priority: "Low"
    });

    const req = {
      json: async () => ({ examId: "none" }),
    } as unknown as Request;

    const res = await PATCH(req, { params });
    expect(res.status).not.toBe(500);
  });

  test("PATCH with null dueDate clears date", async () => {
    mockFindUnique.mockResolvedValue({ id: "task1", completed: false });
    mockUpdate.mockResolvedValue({
      id: "task1", userId: "user1", completed: false, priority: "Low"
    });

    const req = {
      json: async () => ({ dueDate: null }),
    } as unknown as Request;

    const res = await PATCH(req, { params });
    expect(res.status).not.toBe(500);
  });

  test("PATCH with valid dueDate sets date", async () => {
    mockFindUnique.mockResolvedValue({ id: "task1", completed: false });
    mockUpdate.mockResolvedValue({
      id: "task1", userId: "user1", completed: false, priority: "Low"
    });

    const req = {
      json: async () => ({ dueDate: "2026-07-01" }),
    } as unknown as Request;

    const res = await PATCH(req, { params });
    expect(res.status).not.toBe(500);
  });

  test("PATCH with scheduledDate null clears it", async () => {
    mockFindUnique.mockResolvedValue({ id: "task1", completed: false });
    mockUpdate.mockResolvedValue({
      id: "task1", userId: "user1", completed: false, priority: "Low"
    });

    const req = {
      json: async () => ({ scheduledDate: null }),
    } as unknown as Request;

    const res = await PATCH(req, { params });
    expect(res.status).not.toBe(500);
  });

  test("PATCH updates all optional fields", async () => {
    mockFindUnique.mockResolvedValue({ id: "task1", completed: false });
    mockUpdate.mockResolvedValue({ id: "task1", completed: false, priority: "Medium", userId: "u1" });

    const fullBody = {
      title: "New title",
      description: "New desc",
      dueDate: "2026-01-01",
      priority: "High",
      duration: "60",
      subtasks: "Sub1, Sub2",
      bufferDays: 2, 
      url: "https://test.com",
      isRecurring: true,
      recurrence: { type: "weekly" },
      missedAt: "2026-01-01",
      carriedFrom: "old-id",
      progress: 50,
      eventId: "event-123"
    };

    const req = { json: async () => fullBody } as Request;
    const res = await PATCH(req, { params: Promise.resolve({ id: "task1" })});
    expect(res.status).toBe(200);
  })
});

