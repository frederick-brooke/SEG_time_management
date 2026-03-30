/**
 * Testing for the admins/appeal/[id] api route
 */

import { PATCH } from "../[id]/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// Mocks

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
  },
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    appeal: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  },
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {}
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Tests

describe("PATCH /api/appeals/[id]", () => {
  const mockParams = Promise.resolve({ id: "appeal123" });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 403 if user not superuser", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req: any = {
      json: jest.fn(),
    };

    const res = await PATCH(req, { params: mockParams });

    expect(res.status).toBe(403);
  });

  test("returns 404 if appeal not found", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin", role: "SUPERUSER" },
    });

    (prisma.appeal.findUnique as jest.Mock).mockResolvedValue(null);

    const req: any = {
      json: jest.fn().mockResolvedValue({ action: "APPROVE" }),
    };

    const res = await PATCH(req, { params: mockParams });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Appeal not found");
  });

  test("approves appeal and unbans user", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin1", role: "SUPERUSER" },
    });

    (prisma.appeal.findUnique as jest.Mock).mockResolvedValue({
      id: "appeal123",
      userId: "user123",
    });

    const req: any = {
      json: jest.fn().mockResolvedValue({ action: "APPROVE" }),
    };

    const res = await PATCH(req, { params: mockParams });
    const data = await res.json();

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user123" },
      data: {
        isBanned: false,
        banExpires: null,
      },
    });

    expect(prisma.appeal.update).toHaveBeenCalledWith({
      where: { id: "appeal123" },
      data: { status: "APPROVED", handledById: "admin1" },
    });

    expect(data.success).toBe(true);
  });

  test("rejects appeal and keeps user banned", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin", role: "SUPERUSER" },
    });

    (prisma.appeal.findUnique as jest.Mock).mockResolvedValue({
      id: "appeal123",
      userId: "user123",
    });

    const req: any = {
      json: jest.fn().mockResolvedValue({ action: "REJECT" }),
    };

    const res = await PATCH(req, { params: mockParams });
    const data = await res.json();

    expect(prisma.appeal.update).toHaveBeenCalledWith({
      where: { id: "appeal123" },
      data: { status: "REJECTED" },
    });

    expect(data.success).toBe(true);
  });

  test("handles internal errors", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin", role: "SUPERUSER" },
    });

    (prisma.appeal.findUnique as jest.Mock).mockImplementation(() => {
      throw new Error("DB failure");
    });

    const req: any = {
      json: jest.fn().mockResolvedValue({ action: "APPROVE" }),
    };

    const res = await PATCH(req, { params: mockParams });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("DB failure");
  });
});