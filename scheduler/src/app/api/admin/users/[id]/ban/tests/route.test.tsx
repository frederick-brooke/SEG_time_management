import { PATCH } from "../route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      status: init?.status || 200,
      json: async () => data,
    }),
  },
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { update: jest.fn() },
    report: { update: jest.fn() },
  },
}));

describe("PATCH /api/admin/users/[id]/ban", () => {
  const mockParams = { params: { id: "user123" } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockRequest(body: any) {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as Request;
  }

  test("returns 403 if not SUPERUSER", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const res = await PATCH(mockRequest({}), mockParams);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Unauthorized");
  });

  test("applies temporary ban", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin1", role: "SUPERUSER" },
    });

    const req = mockRequest({
      type: "TEMP",
      durationDays: 7,
    });

    const res = await PATCH(req, mockParams);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user123" },
        data: expect.objectContaining({
          isBanned: true,
        }),
      })
    );

    expect(res.status).toBe(200);
  });

  test("applies permanent ban", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin1", role: "SUPERUSER" },
    });

    const req = mockRequest({ type: "PERMANENT" });

    await PATCH(req, mockParams);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          isBanned: true,
          banExpires: null,
        },
      })
    );
  });

  test("unbans user", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin1", role: "SUPERUSER" },
    });

    const req = mockRequest({ type: "UNBAN" });

    await PATCH(req, mockParams);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          isBanned: false,
          banExpires: null,
        },
      })
    );
  });

  test("updates report when reportId is provided", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "admin1", role: "SUPERUSER" },
    });

    const req = mockRequest({
      type: "PERMANENT",
      reportId: "report1",
    });

    await PATCH(req, mockParams);

    expect(prisma.report.update).toHaveBeenCalledWith({
      where: { id: "report1" },
      data: {
        status: "RESOLVED",
        handledById: "admin1",
      },
    });
  });

  test("returns 400 if TEMP ban missing durationDays", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: "SUPERUSER" },
    });

    const req = mockRequest({ type: "TEMP" });

    const res = await PATCH(req, mockParams);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("durationDays required for TEMP ban");
  });

  test("handles database errors", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: "SUPERUSER" },
    });

    (prisma.user.update as jest.Mock).mockRejectedValue(
      new Error("DB failure")
    );

    const req = mockRequest({ type: "PERMANENT" });

    const res = await PATCH(req, mockParams);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("DB failure");
  });
});