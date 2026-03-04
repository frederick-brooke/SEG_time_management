import { GET, POST } from "../route";
import { PATCH, DELETE } from "../[id]/route";
import prisma from "@/src/lib/prisma";
import { NextResponse } from "next/server";

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      json: async () => body,
      status: init?.status || 200,
      ok: !init?.status || init.status < 400,
    })),
  },
}));

// Mock Prisma
jest.mock("@/src/lib/prisma", () => ({
  __esModule: true,
  default: {
    task: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("Tasks API Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/tasks", () => {
    it("returns 400 when userId is missing", async () => {
      const req = new Request("http://localhost/api/tasks");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("User ID required");
    });

    it("returns empty array when user has no tasks", async () => {
      prisma.task.findMany.mockResolvedValue([]);

      const req = new Request("http://localhost/api/tasks?userId=user123");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks).toEqual([]);
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { userId: "user123" },
        orderBy: { createdAt: "desc" },
      });
    });

    it("returns user's tasks", async () => {
      const mockTasks = [
        {
          id: "task1",
          title: "Task 1",
          description: "Description 1",
          dueDate: new Date("2024-12-31"),
          userId: "user123",
          completed: false,
          status: "todo",
          priority: "High",
          duration: 60,
          subtasks: ["subtask1"],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "task2",
          title: "Task 2",
          description: "Description 2",
          dueDate: new Date("2024-12-25"),
          userId: "user123",
          completed: false,
          status: "in-progress",
          priority: "Medium",
          duration: 30,
          subtasks: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.task.findMany.mockResolvedValue(mockTasks);

      const req = new Request("http://localhost/api/tasks?userId=user123");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks).toEqual(mockTasks);
      expect(data.tasks.length).toBe(2);
    });

    it("returns 500 when database error occurs", async () => {
      prisma.task.findMany.mockRejectedValue(new Error("DB error"));

      const req = new Request("http://localhost/api/tasks?userId=user123");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch tasks");
    });
  });

  describe("POST /api/tasks", () => {
    it("creates a task successfully", async () => {
      const newTask = {
        title: "New Task",
        description: "Task description",
        dueDate: "2024-12-31T00:00:00.000Z",
        userId: "user123",
        priority: "High",
        duration: 60,
        subtasks: ["subtask1"],
      };

      const mockCreatedTask = {
        id: "task123",
        ...newTask,
        dueDate: new Date(newTask.dueDate),
        completed: false,
        status: "todo",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.task.create.mockResolvedValue(mockCreatedTask);

      const req = new Request("http://localhost/api/tasks", {
        method: "POST",
        body: JSON.stringify(newTask),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.task.id).toBe("task123");
      expect(data.task.title).toBe("New Task");
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          title: newTask.title,
          description: newTask.description,
          dueDate: expect.any(Date),
          userId: newTask.userId,
          completed: false,
          priority: newTask.priority,
          duration: newTask.duration,
          subtasks: newTask.subtasks,
        },
      });
    });

    it("creates task with default values when optional fields missing", async () => {
      const minimalTask = {
        title: "Minimal Task",
        dueDate: "2024-12-31T00:00:00.000Z",
        userId: "user123",
      };

      const mockCreatedTask = {
        id: "task123",
        title: "Minimal Task",
        description: null,
        dueDate: new Date(minimalTask.dueDate),
        userId: "user123",
        completed: false,
        status: "todo",
        priority: "Low",
        duration: 0,
        subtasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.task.create.mockResolvedValue(mockCreatedTask);

      const req = new Request("http://localhost/api/tasks", {
        method: "POST",
        body: JSON.stringify(minimalTask),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.task.priority).toBe("Low");
      expect(data.task.duration).toBe(0);
      expect(data.task.subtasks).toEqual([]);
    });

    it("returns 500 when database error occurs", async () => {
      prisma.task.create.mockRejectedValue(new Error("DB error"));

      const req = new Request("http://localhost/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: "Task",
          dueDate: "2024-12-31",
          userId: "user123",
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create task");
    });
  });

  describe("PATCH /api/tasks/[id]", () => {
    it("updates a task successfully", async () => {
      const updates = {
        title: "Updated Task",
        status: "completed",
      };

      const mockUpdatedTask = {
        id: "task123",
        title: "Updated Task",
        description: "Description",
        dueDate: new Date(),
        userId: "user123",
        completed: false,
        status: "completed",
        priority: "High",
        duration: 60,
        subtasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.task.update.mockResolvedValue(mockUpdatedTask);

      const req = new Request("http://localhost/api/tasks/task123", {
        method: "PATCH",
        body: JSON.stringify(updates),
      });

      const response = await PATCH(req, { params: { id: "task123" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.task.title).toBe("Updated Task");
      expect(data.task.status).toBe("completed");
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: "task123" },
        data: updates,
      });
    });

    it("returns 500 when database error occurs", async () => {
      prisma.task.update.mockRejectedValue(new Error("DB error"));

      const req = new Request("http://localhost/api/tasks/task123", {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated" }),
      });

      const response = await PATCH(req, { params: { id: "task123" } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to update task");
    });
    describe("PATCH /api/tasks/[id]", () => {
      it("updates a task successfully", async () => {
        const updates = {
          title: "Updated Task",
          status: "completed",
        };

        const mockUpdatedTask = {
          id: "task123",
          title: "Updated Task",
          description: "Description",
          dueDate: new Date(),
          userId: "user123",
          completed: false,
          status: "completed",
          priority: "High",
          duration: 60,
          subtasks: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        prisma.task.update.mockResolvedValue(mockUpdatedTask);

        const req = new Request("http://localhost/api/tasks/task123", {
          method: "PATCH",
          body: JSON.stringify(updates),
        });

        const response = await PATCH(req, { params: { id: "task123" } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.task.title).toBe("Updated Task");
        expect(data.task.status).toBe("completed");
      });

      // ADD THIS NEW TEST for line 30 (dueDate)
      it("updates task with dueDate conversion", async () => {
        const updates = {
          title: "Task with date",
          dueDate: "2024-12-31T00:00:00.000Z",
        };

        const mockUpdatedTask = {
          id: "task123",
          title: "Task with date",
          dueDate: new Date("2024-12-31T00:00:00.000Z"),
          userId: "user123",
          completed: false,
          status: "todo",
          priority: "High",
          duration: 60,
          subtasks: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        prisma.task.update.mockResolvedValue(mockUpdatedTask);

        const req = new Request("http://localhost/api/tasks/task123", {
          method: "PATCH",
          body: JSON.stringify(updates),
        });

        const response = await PATCH(req, { params: { id: "task123" } });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(prisma.task.update).toHaveBeenCalledWith({
          where: { id: "task123" },
          data: {
            title: "Task with date",
            dueDate: expect.any(Date),
          },
        });
      });

      // ADD THIS for all fields
      it("updates all task fields", async () => {
        const updates = {
          title: "Full Update",
          description: "New description",
          dueDate: "2024-12-31T00:00:00.000Z",
          completed: true,
          status: "completed",
          priority: "High",
          duration: 120,
          subtasks: ["sub1", "sub2"],
        };

        const mockUpdatedTask = {
          id: "task123",
          ...updates,
          dueDate: new Date(updates.dueDate),
          userId: "user123",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        prisma.task.update.mockResolvedValue(mockUpdatedTask);

        const req = new Request("http://localhost/api/tasks/task123", {
          method: "PATCH",
          body: JSON.stringify(updates),
        });

        const response = await PATCH(req, { params: { id: "task123" } });

        expect(response.status).toBe(200);
        expect(prisma.task.update).toHaveBeenCalledWith({
          where: { id: "task123" },
          data: {
            title: "Full Update",
            description: "New description",
            dueDate: expect.any(Date),
            completed: true,
            status: "completed",
            priority: "High",
            duration: 120,
            subtasks: ["sub1", "sub2"],
          },
        });
      });

      it("returns 500 when database error occurs", async () => {
        prisma.task.update.mockRejectedValue(new Error("DB error"));

        const req = new Request("http://localhost/api/tasks/task123", {
          method: "PATCH",
          body: JSON.stringify({ title: "Updated" }),
        });

        const response = await PATCH(req, { params: { id: "task123" } });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe("Failed to update task");
      });
    });
  });

  describe("DELETE /api/tasks/[id]", () => {
    it("deletes a task successfully", async () => {
      prisma.task.delete.mockResolvedValue({
        id: "task123",
        title: "Deleted Task",
      });

      const req = new Request("http://localhost/api/tasks/task123", {
        method: "DELETE",
      });

      const response = await DELETE(req, { params: { id: "task123" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prisma.task.delete).toHaveBeenCalledWith({
        where: { id: "task123" },
      });
    });

    it("returns 500 when database error occurs", async () => {
      prisma.task.delete.mockRejectedValue(new Error("DB error"));

      const req = new Request("http://localhost/api/tasks/task123", {
        method: "DELETE",
      });

      const response = await DELETE(req, { params: { id: "task123" } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to delete task");
    });
  });
});
