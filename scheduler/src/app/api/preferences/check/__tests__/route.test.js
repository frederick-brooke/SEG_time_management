import { GET, POST } from "../route";
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
    userPreferences: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe("Preferences API Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/preferences/check", () => {
    it("returns 400 when userId is missing", async () => {
      const req = new Request("http://localhost/api/preferences/check");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("User ID required");
    });

    it("returns hasPreferences: false when preferences don't exist", async () => {
      prisma.userPreferences.findUnique.mockResolvedValue(null);

      const req = new Request("http://localhost/api/preferences/check?userId=123");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasPreferences).toBe(false);
      expect(prisma.userPreferences.findUnique).toHaveBeenCalledWith({
        where: { userId: "123" },
      });
    });

    it("returns hasPreferences: true when preferences exist", async () => {
      prisma.userPreferences.findUnique.mockResolvedValue({
        id: "pref123",
        userId: "123",
        workStartTime: "09:00",
      });

      const req = new Request("http://localhost/api/preferences/check?userId=123");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasPreferences).toBe(true);
    });

    it("returns 500 when database error occurs", async () => {
      prisma.userPreferences.findUnique.mockRejectedValue(new Error("DB error"));

      const req = new Request("http://localhost/api/preferences/check?userId=123");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to check preferences");
    });
  });

  describe("POST /api/preferences", () => {
    it("returns 400 when userId is missing", async () => {
      const req = new Request("http://localhost/api/preferences", {
        method: "POST",
        body: JSON.stringify({ workStartTime: "09:00" }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("User ID required");
    });

    it("creates preferences successfully", async () => {
      const mockPreferences = {
        id: "pref123",
        userId: "user123",
        workStartTime: "09:00",
        workEndTime: "17:00",
        daysOff: ["Saturday", "Sunday"],
        sessionLength: 60,
        breakLength: 15,
        breaksPerDay: 2,
        taskOrder: "hard-first",
        maxTasksPerDay: 5,
        defaultTaskDuration: 30,
        reminderDays: 1,
      };

      prisma.userPreferences.create.mockResolvedValue(mockPreferences);

      const req = new Request("http://localhost/api/preferences", {
        method: "POST",
        body: JSON.stringify({
          userId: "user123",
          workStartTime: "09:00",
          workEndTime: "17:00",
          daysOff: ["Saturday", "Sunday"],
          sessionLength: 60,
          breakLength: 15,
          breaksPerDay: 2,
          taskOrder: "hard-first",
          maxTasksPerDay: 5,
          defaultTaskDuration: 30,
          reminderDays: 1,
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.preferences).toEqual(mockPreferences);
    });

    it("returns 500 when database error occurs", async () => {
      prisma.userPreferences.create.mockRejectedValue(new Error("DB error"));

      const req = new Request("http://localhost/api/preferences", {
        method: "POST",
        body: JSON.stringify({
          userId: "user123",
          workStartTime: "09:00",
          workEndTime: "17:00",
          daysOff: [],
          sessionLength: 60,
          breakLength: 15,
          breaksPerDay: 2,
          taskOrder: "hard-first",
          maxTasksPerDay: 5,
          defaultTaskDuration: 30,
          reminderDays: 1,
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to save preferences");
    });
  });
});