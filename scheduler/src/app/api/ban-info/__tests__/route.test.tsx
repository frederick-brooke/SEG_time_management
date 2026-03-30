/**
 * Testing for ban-info api route
 */

import { GET } from "../route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// Mocks

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    report: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}));

// Tests

describe("GET /api/user/ban", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 if no session", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns default reason if no resolved report", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user123" },
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user123",
      banExpires: null,
    });

    (prisma.report.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await GET();
    const data = await res.json();

    expect(prisma.report.findFirst).toHaveBeenCalledWith({
      where: {
        reportedUserId: "user123",
        status: "RESOLVED",
      },
      orderBy: { createdAt: "desc" },
    });

    expect(data).toEqual({
      reason: "Violation of community rules",
      expires: null,
      reportId: undefined,
    });
  });

  it("returns latest resolved report info", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user123" },
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user123",
      banExpires: new Date("2025-01-01"),
    });

    (prisma.report.findFirst as jest.Mock).mockResolvedValue({
      id: "report999",
      description: "Spam content",
    });

    const res = await GET();
    const data = await res.json();

    expect(data).toEqual({
      reason: "Spam content",
      expires: new Date("2025-01-01"),
      reportId: "report999",
    });
  });

  it("handles missing user gracefully", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user123" },
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.report.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await GET();
    const data = await res.json();

    expect(data.expires).toBeUndefined();
  });
});