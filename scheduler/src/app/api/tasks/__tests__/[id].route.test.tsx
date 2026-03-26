/**
 * @file route.test.ts
 */

import { DELETE, PATCH } from "@/app/api/tasks/[id]/route";
import { prisma } from "@/lib/prisma";
import { awardTaskPoints, revokeTaskPoints } from "@/lib/points";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
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
  },
}));

jest.mock("@/lib/points", () => ({
  awardTaskPoints: jest.fn(),
  revokeTaskPoints: jest.fn(),
}));

const mockParams = (id: string) =>
  Promise.resolve({ id });

const mockRequest = (body: any) =>
  ({
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Request);

describe("Task API route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 
  // DELETE
  // 
  describe("DELETE", () => {
    it("deletes a task successfully", async () => {
      (prisma.task.delete as jest.Mock).mockResolvedValue({});

      const res = await DELETE({} as Request, {
        params: mockParams("1"),
      });

      const json = await res.json();

      expect(prisma.task.delete).toHaveBeenCalledWith({
        where: { id: "1" },
      });
      expect(json).toEqual({ success: true });
    });

    it("handles delete error", async () => {
      (prisma.task.delete as jest.Mock).mockRejectedValue(
        new Error("fail"),
      );

      const res = await DELETE({} as Request, {
        params: mockParams("1"),
      });

      expect(res.status).toBe(500);
    });
  });

  // 
  // PATCH
  // 
  describe("PATCH", () => {
    const baseTask = {
      id: "1",
      userId: "user1",
      completed: false,
      priority: "Medium",
    };

    it("returns 404 if task not found", async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await PATCH(mockRequest({}), {
        params: mockParams("1"),
      });

      expect(res.status).toBe(404);
    });

    it("updates basic fields", async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(baseTask);
      (prisma.task.update as jest.Mock).mockResolvedValue({
        ...baseTask,
        completed: false,
      });

      const body = {
        title: "New title",
        description: "desc",
        duration: "30",
      };

      const res = await PATCH(mockRequest(body), {
        params: mockParams("1"),
      });

      const json = await res.json();

      expect(prisma.task.update).toHaveBeenCalled();
      expect(json.task).toBeDefined();
    });

    it("marks task completed and awards points", async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        ...baseTask,
        completed: false,
      });

      (prisma.task.update as jest.Mock).mockResolvedValue({
        ...baseTask,
        completed: true,
        priority: "High",
      });

      const res = await PATCH(
        mockRequest({ status: "completed" }),
        { params: mockParams("1") },
      );

      const json = await res.json();

      expect(awardTaskPoints).toHaveBeenCalled();
      expect(json.rewards).toEqual({ xp: 30, coins: 15 });
    });

    it("reverts completion and revokes points", async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        ...baseTask,
        completed: true,
      });

      (prisma.task.update as jest.Mock).mockResolvedValue({
        ...baseTask,
        completed: false,
      });

      await PATCH(
        mockRequest({ completed: false }),
        { params: mockParams("1") },
      );

      expect(revokeTaskPoints).toHaveBeenCalled();
    });

    it("links exam correctly", async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(baseTask);

      (prisma.exam.findUnique as jest.Mock).mockResolvedValue({
        id: "exam1",
        title: "Math",
      });

      (prisma.task.update as jest.Mock).mockResolvedValue({
        ...baseTask,
      });

      await PATCH(
        mockRequest({ examId: "exam1" }),
        { params: mockParams("1") },
      );

      expect(prisma.exam.findUnique).toHaveBeenCalledWith({
        where: { id: "exam1" },
      });
    });

    it("removes exam when examId is none", async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(baseTask);
      (prisma.task.update as jest.Mock).mockResolvedValue(baseTask);

      await PATCH(
        mockRequest({ examId: "none" }),
        { params: mockParams("1") },
      );

      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            examId: null,
            category: "General",
          }),
        }),
      );
    });

    it("handles date fields correctly", async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(baseTask);
      (prisma.task.update as jest.Mock).mockResolvedValue(baseTask);

      await PATCH(
        mockRequest({
          dueDate: "2025-01-01",
          scheduledDate: "2025-01-02",
        }),
        { params: mockParams("1") },
      );

      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            dueDate: expect.any(Date),
            scheduledDate: expect.any(Date),
          }),
        }),
      );
    });

    it("handles PATCH error", async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(baseTask);
      (prisma.task.update as jest.Mock).mockRejectedValue(
        new Error("fail"),
      );

      const res = await PATCH(mockRequest({}), {
        params: mockParams("1"),
      });

      expect(res.status).toBe(500);
    });
  });
});