import { PATCH } from "../route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: jest.fn(),
    },
    report: {
      update: jest.fn(),
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

describe("PATCH /api/admin/users/[id] (ban system)", () => {
  const mockParams = Promise.resolve({ id: "user123" });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 403 if not SUPERUSER", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = {
      json: async () => ({ type: "TEMP", durationDays: 3 }),
    } as any;

    const res = await PATCH(req, { params: mockParams });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Unauthorized");
  });

  it("applies TEMP ban", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: "SUPERUSER", id: "admin1" },
    });

    const req = {
      json: async () => ({ type: "TEMP", durationDays: 7 }),
    } as any;

    const res = await PATCH(req, { params: mockParams });
    const data = await res.json();

    expect(prisma.user.update).toHaveBeenCalled();

    const updateArgs = (prisma.user.update as jest.Mock).mock.calls[0][0];

    expect(updateArgs.where).toEqual({ id: "user123" });
    expect(updateArgs.data.isBanned).toBe(true);
    expect(updateArgs.data.banExpires).toBeInstanceOf(Date);

    expect(data.success).toBe(true);
  });

  it("applies PERMANENT ban", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: "SUPERUSER", id: "admin1" },
    });

    const req = {
      json: async () => ({ type: "PERMANENT" }),
    } as any;

    await PATCH(req, { params: mockParams });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user123" },
      data: {
        isBanned: true,
        banExpires: null,
      },
    });
  });

  it("unbans user", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: "SUPERUSER", id: "admin1" },
    });

    const req = {
      json: async () => ({ type: "UNBAN" }),
    } as any;

    await PATCH(req, { params: mockParams });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user123" },
      data: {
        isBanned: false,
        banExpires: null,
      },
    });
  });

  it("resolves report if reportId provided", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: "SUPERUSER", id: "admin99" },
    });

    const req = {
      json: async () => ({
        type: "PERMANENT",
        reportId: "report123",
      }),
    } as any;

    await PATCH(req, { params: mockParams });

    expect(prisma.report.update).toHaveBeenCalledWith({
      where: { id: "report123" },
      data: {
        status: "RESOLVED",
        handledById: "admin99",
      },
    });
  });

  it("returns 500 if prisma throws", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: "SUPERUSER", id: "admin1" },
    });

    (prisma.user.update as jest.Mock).mockRejectedValue(
      new Error("DB failure")
    );

    const req = {
      json: async () => ({ type: "PERMANENT" }),
    } as any;

    const res = await PATCH(req, { params: mockParams });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("DB failure");
  });
});