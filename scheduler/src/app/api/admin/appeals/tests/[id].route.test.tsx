import { PATCH } from "../[id]/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

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

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

describe("PATCH /api/admin/appeals/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockParams = Promise.resolve({ id: "appeal123" });

  it("returns 403 if not SUPERUSER", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = {
      json: async () => ({ action: "APPROVE" }),
    } as any;

    const res = await PATCH(req, { params: mockParams });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 404 if appeal not found", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: "SUPERUSER", id: "admin1" },
    });

    (prisma.appeal.findUnique as jest.Mock).mockResolvedValue(null);

    const req = {
      json: async () => ({ action: "APPROVE" }),
    } as any;

    const res = await PATCH(req, { params: mockParams });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Appeal not found");
  });

  it("approves appeal and unbans user", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: "SUPERUSER", id: "admin1" },
    });

    (prisma.appeal.findUnique as jest.Mock).mockResolvedValue({
      id: "appeal123",
      userId: "user123",
    });

    const req = {
      json: async () => ({ action: "APPROVE" }),
    } as any;

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

  it("rejects appeal", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: "SUPERUSER", id: "admin1" },
    });

    (prisma.appeal.findUnique as jest.Mock).mockResolvedValue({
      id: "appeal123",
      userId: "user123",
    });

    const req = {
      json: async () => ({ action: "REJECT" }),
    } as any;

    const res = await PATCH(req, { params: mockParams });
    const data = await res.json();

    expect(prisma.appeal.update).toHaveBeenCalledWith({
      where: { id: "appeal123" },
      data: { status: "REJECTED" },
    });

    expect(data.success).toBe(true);
  });

  it("returns 500 if prisma throws", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: "SUPERUSER", id: "admin1" },
    });

    (prisma.appeal.findUnique as jest.Mock).mockRejectedValue(
      new Error("DB error")
    );

    const req = {
      json: async () => ({ action: "APPROVE" }),
    } as any;

    const res = await PATCH(req, { params: mockParams });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe("DB error");
  });
});