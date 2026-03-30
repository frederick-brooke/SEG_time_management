import { GET, POST } from "../route";
import { prisma } from "@/lib/prisma";
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
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    userPreferences: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

const findUniqueMock = jest.mocked(prisma.userPreferences.findUnique);
const upsertMock = jest.mocked(prisma.userPreferences.upsert);

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
      findUniqueMock.mockResolvedValue(null);

      const req = new Request("http://localhost/api/preferences/check?userId=123");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasPreferences).toBe(false);
      expect(findUniqueMock).toHaveBeenCalledWith({
        where: { userId: "123" },
      });
    });

    it("returns hasPreferences: true when preferences exist", async () => {
      findUniqueMock.mockResolvedValue({
        id: "pref123",
        userId: "123",
        workStartTime: "09:00",
      } as any);

      const req = new Request("http://localhost/api/preferences/check?userId=123");
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasPreferences).toBe(true);
    });

    it("returns 500 when database error occurs", async () => {
      findUniqueMock.mockRejectedValue(new Error("DB error"));

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

    it("uses default values when optional fields are missing", async () => {
      const mockPreferences = { id: "1", userId: "user123" } as any;

      upsertMock.mockResolvedValue(mockPreferences);

      const req = new Request("http://localhost/api/preferences", {
        method: "POST",
        body: JSON.stringify({ userId: "user123" }),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.preferences).toEqual(mockPreferences);

      const call = upsertMock.mock.calls[0][0];

      expect(call.create).toMatchObject({
        workStartTime: "09:00",
        workEndTime: "17:00",
        daysOff: [],
        sessionLength: 60,
        breakLength: 15,
        breaksPerDay: 3,
        taskOrder: "priority",
        maxTasksPerDay: 10,
        defaultTaskDuration: 30,
        reminderDays: 1,
      });
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
      } as any;

      upsertMock.mockResolvedValue(mockPreferences);

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
      upsertMock.mockRejectedValue(new Error("DB error"));

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
