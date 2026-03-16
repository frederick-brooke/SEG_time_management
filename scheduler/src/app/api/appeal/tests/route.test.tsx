import { POST } from "../route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    appeal: {
      create: jest.fn(),
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

describe("POST /api/appeals (create appeal)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 if no session", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = {
      json: async () => ({
        description: "Please unban me",
        reportId: "report123",
      }),
    } as any;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 if reportId missing", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user123" },
    });

    const req = {
      json: async () => ({
        description: "Please unban me",
      }),
    } as any;

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 400 if description missing", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user123" },
    });

    const req = {
      json: async () => ({
        reportId: "report123",
      }),
    } as any;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Description required");
  });

  it("creates appeal successfully", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user123" },
    });

    (prisma.appeal.create as jest.Mock).mockResolvedValue({});

    const req = {
      json: async () => ({
        description: "Please review my case",
        reportId: "report123",
      }),
    } as any;

    const res = await POST(req);
    const data = await res.json();

    expect(prisma.appeal.create).toHaveBeenCalledWith({
      data: {
        description: "Please review my case",
        user: { connect: { id: "user123" } },
        report: { connect: { id: "report123" } },
      },
    });

    expect(data.success).toBe(true);
  });

  it("returns 500 if prisma throws", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user123" },
    });

    (prisma.appeal.create as jest.Mock).mockRejectedValue(
      new Error("DB failure")
    );

    const req = {
      json: async () => ({
        description: "Please review my case",
        reportId: "report123",
      }),
    } as any;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Server error");
  });
});