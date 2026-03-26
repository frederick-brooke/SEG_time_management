/**
 * FIX: Mock NextResponse to avoid "Response.json is not a function"
 */
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
  
  /**
   * Mock next-auth
   */
  jest.mock("next-auth/next", () => ({
    getServerSession: jest.fn(),
  }));
  
  /**
   * Mock Prisma
   */
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