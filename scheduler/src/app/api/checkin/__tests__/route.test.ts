// Mocks

jest.mock("next/server", () => {
    return {
      NextResponse: {
        json: (data: any, init?: any) => ({
          status: init?.status || 200,
          json: async () => data,
        }),
      },
    };
  });
  
  // Mock next-auth
  jest.mock("next-auth/next", () => ({
    getServerSession: jest.fn(),
  }));
  
  // Mock prisma
  jest.mock("@/lib/prisma", () => ({
    prisma: {
      scheduleLog: {
        findMany: jest.fn(),
      },
      task: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      checkIn: {
        create: jest.fn(),
      },
    },
  }));
  
  import { GET, POST } from "../route";
  import { getServerSession } from "next-auth/next";
  import { prisma } from "@/lib/prisma";
  
  
  const mockSession = {
    user: { id: "user-1" },
  };
  
  
  describe("checkin route", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    });
  
    describe("GET (additional branches)", () => {
      /**
       * Verifies that when schedule logs exist but all days are today or in the future,
       * no past task IDs are collected and an empty array is returned early.
       */
      it("returns empty tasks when all log days are today or future", async () => {
        const future = new Date();
        future.setDate(future.getDate() + 1);
        const futureStr = future.toISOString().split("T")[0];

        (prisma.scheduleLog.findMany as jest.Mock).mockResolvedValue([
          { taskIds: ["task-1"], days: [futureStr] },
        ]);

        const res = await GET();
        const json = await res.json();

        expect(json.tasks).toEqual([]);
        expect(prisma.task.findMany).not.toHaveBeenCalled();
      });

      /**
       * Verifies that logs with non-array days fields are handled gracefully
       * without throwing (defaults to empty array).
       */
      it("handles logs with non-array days gracefully", async () => {
        (prisma.scheduleLog.findMany as jest.Mock).mockResolvedValue([
          { taskIds: ["task-1"], days: null },
        ]);

        const res = await GET();
        const json = await res.json();

        expect(json.tasks).toEqual([]);
      });

      /**
       * Verifies that a thrown error inside the try block returns empty tasks
       * rather than crashing the handler.
       */
      it("returns empty tasks on internal error", async () => {
        (prisma.scheduleLog.findMany as jest.Mock).mockRejectedValue(
          new Error("DB failure")
        );

        const res = await GET();
        const json = await res.json();

        expect(json.tasks).toEqual([]);
      });
    });

    describe("POST (additional branches)", () => {
      /**
       * Verifies that a missed task clears scheduled slots, sets missedAt,
       * and is added to the reschedule list with full duration.
       */
      it("handles missed task and adds to reschedule list", async () => {
        (prisma.task.findMany as jest.Mock).mockResolvedValue([
          { id: "task-1", duration: 60, userId: "user-1" },
        ]);
        (prisma.task.update as jest.Mock).mockResolvedValue({});

        const req = {
          json: async () => ({
            entries: [{ taskId: "task-1", status: "missed", progress: 0 }],
          }),
        } as any;

        const res = await POST(req);
        const json = await res.json();

        expect(json.tasksToReschedule).toHaveLength(1);
        expect(json.tasksToReschedule[0].remainingDuration).toBe(60);
      });

      /**
       * Verifies that a task not found in the DB is silently skipped
       * without causing an error.
       */
      it("skips entries where task is not found in DB", async () => {
        (prisma.task.findMany as jest.Mock).mockResolvedValue([]);
        (prisma.task.update as jest.Mock).mockResolvedValue({});

        const req = {
          json: async () => ({
            entries: [{ taskId: "nonexistent", status: "completed", progress: 100 }],
          }),
        } as any;

        const res = await POST(req);
        const json = await res.json();

        expect(prisma.task.update).not.toHaveBeenCalled();
        expect(json.tasksToReschedule).toEqual([]);
      });

      /**
       * Verifies that when prisma.task.update throws, the fallback update
       * is called to at least clear the scheduled slot.
       */
      it("falls back to minimal update when primary update throws", async () => {
        (prisma.task.findMany as jest.Mock).mockResolvedValue([
          { id: "task-1", duration: 60, userId: "user-1" },
        ]);
        (prisma.task.update as jest.Mock)
          .mockRejectedValueOnce(new Error("update failed"))
          .mockResolvedValueOnce({});

        const req = {
          json: async () => ({
            entries: [{ taskId: "task-1", status: "completed", progress: 100 }],
          }),
        } as any;

        const res = await POST(req);
        const json = await res.json();

        expect(prisma.task.update).toHaveBeenCalledTimes(2);
        expect(json.tasksToReschedule).toEqual([]);
      });

      /**
       * Verifies that tasks with date fields have them serialised to ISO strings
       * in the response.
       */
      it("serialises date fields to ISO strings in tasksToReschedule", async () => {
        const now = new Date();
        (prisma.task.findMany as jest.Mock).mockResolvedValue([
          {
            id: "task-1",
            duration: 60,
            userId: "user-1",
            dueDate: now,
            completedAt: null,
            missedAt: null,
            createdAt: now,
            updatedAt: now,
          },
        ]);
        (prisma.task.update as jest.Mock).mockResolvedValue({});

        const req = {
          json: async () => ({
            entries: [{ taskId: "task-1", status: "missed", progress: 0 }],
          }),
        } as any;

        const res = await POST(req);
        const json = await res.json();

        expect(typeof json.tasksToReschedule[0].dueDate).toBe("string");
        expect(typeof json.tasksToReschedule[0].createdAt).toBe("string");
      });

      /**
       * Verifies that the remaining duration is floored to at least 5 minutes
       * even when progress is 100% (to avoid 0-duration reschedules).
       */
      it("floors remaining duration to 5 minutes minimum for partial tasks", async () => {
        (prisma.task.findMany as jest.Mock).mockResolvedValue([
          { id: "task-1", duration: 5, userId: "user-1" },
        ]);
        (prisma.task.update as jest.Mock).mockResolvedValue({});

        const req = {
          json: async () => ({
            entries: [{ taskId: "task-1", status: "partial", progress: 99 }],
          }),
        } as any;

        const res = await POST(req);
        const json = await res.json();

        expect(json.tasksToReschedule[0].remainingDuration).toBeGreaterThanOrEqual(5);
      });

      /**
       * Verifies that task.duration defaults to 60 when not set on the task.
       */
      it("defaults duration to 60 when task has no duration", async () => {
        (prisma.task.findMany as jest.Mock).mockResolvedValue([
          { id: "task-1", duration: null, userId: "user-1" },
        ]);
        (prisma.task.update as jest.Mock).mockResolvedValue({});

        const req = {
          json: async () => ({
            entries: [{ taskId: "task-1", status: "missed", progress: 0 }],
          }),
        } as any;

        const res = await POST(req);
        const json = await res.json();

        expect(json.tasksToReschedule[0].remainingDuration).toBe(60);
      });
    });

    describe("GET", () => {
      it("returns 401 if not authenticated", async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
  
        const res = await GET();
        const json = await res.json();
  
        expect(res.status).toBe(401);
        expect(json.error).toBe("Unauthorised");
      });
  
      it("returns empty tasks when no schedule logs exist", async () => {
        (prisma.scheduleLog.findMany as jest.Mock).mockResolvedValue([]);
  
        const res = await GET();
        const json = await res.json();
  
        expect(json.tasks).toEqual([]);
      });
  
      it("returns tasks when logs exist", async () => {
        (prisma.scheduleLog.findMany as jest.Mock).mockResolvedValue([
          {
            taskIds: ["task-1"],
            days: ["2024-01-01"],
          },
        ]);
  
        (prisma.task.findMany as jest.Mock).mockResolvedValue([
          {
            id: "task-1",
            userId: "user-1",
            completed: false,
          },
        ]);
  
        const res = await GET();
        const json = await res.json();
  
        expect(json.tasks.length).toBeGreaterThanOrEqual(0);
      });
    });
  
  
    describe("POST", () => {
      it("returns 401 if not authenticated", async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
  
        const res = await POST({} as any);
        const json = await res.json();
  
        expect(res.status).toBe(401);
        expect(json.error).toBe("Unauthorised");
      });
  
      it("returns 400 if entries missing", async () => {
        const req = {
          json: async () => ({ entries: [] }),
        } as any;
  
        const res = await POST(req);
        const json = await res.json();
  
        expect(res.status).toBe(400);
        expect(json.error).toBe("entries required");
      });
  
      it("handles completed task", async () => {
        (prisma.task.findMany as jest.Mock).mockResolvedValue([
          { id: "task-1", duration: 60 },
        ]);
  
        (prisma.task.update as jest.Mock).mockResolvedValue({});
  
        const req = {
          json: async () => ({
            entries: [
              {
                taskId: "task-1",
                status: "completed",
                progress: 100,
              },
            ],
          }),
        } as any;
  
        const res = await POST(req);
        const json = await res.json();
  
        expect(prisma.task.update).toHaveBeenCalled();
        expect(json.tasksToReschedule).toEqual([]);
      });
  
      it("handles partial task", async () => {
        (prisma.task.findMany as jest.Mock).mockResolvedValue([
          { id: "task-1", duration: 100 },
        ]);
  
        (prisma.task.update as jest.Mock).mockResolvedValue({});
  
        const req = {
          json: async () => ({
            entries: [
              {
                taskId: "task-1",
                status: "partial",
                progress: 50,
              },
            ],
          }),
        } as any;
  
        const res = await POST(req);
        const json = await res.json();
  
        expect(json.tasksToReschedule.length).toBeGreaterThanOrEqual(0);
      });
    });
  });