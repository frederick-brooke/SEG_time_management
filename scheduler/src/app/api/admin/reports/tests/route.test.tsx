import { GET } from "../route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    report: {
      count: jest.fn(),
      findMany: jest.fn(),
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

describe("GET /api/admin/reports", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 403 if not SUPERUSER", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = {
      url: "http://localhost/api/admin/reports",
    } as Request;

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Access denied");
  });

  it("uses default values correctly", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: "SUPERUSER" },
    });

    (prisma.report.count as jest.Mock).mockResolvedValue(20);
    (prisma.report.findMany as jest.Mock).mockResolvedValue([]);

    const req = {
      url: "http://localhost/api/admin/reports",
    } as Request;

    const res = await GET(req);
    const data = await res.json();

    expect(prisma.report.count).toHaveBeenCalledWith({
      where: {},
    });

    expect(prisma.report.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 10,
      })
    );

    expect(data.totalPages).toBe(2); // 20 / 10
  });

  it("applies date and status filters", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: "SUPERUSER" },
    });

    (prisma.report.count as jest.Mock).mockResolvedValue(5);
    (prisma.report.findMany as jest.Mock).mockResolvedValue([]);

    const req = {
      url:
        "http://localhost/api/admin/reports?startDate=2024-01-01&endDate=2024-01-31&status=pending",
    } as Request;

    await GET(req);

    expect(prisma.report.count).toHaveBeenCalledWith({
      where: {
        createdAt: {
          gte: new Date("2024-01-01"),
          lte: new Date("2024-01-31"),
        },
        status: "PENDING",
      },
    });
  });

  it("applies custom sort, page and limit", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: "SUPERUSER" },
    });

    (prisma.report.count as jest.Mock).mockResolvedValue(30);
    (prisma.report.findMany as jest.Mock).mockResolvedValue([]);

    const req = {
      url:
        "http://localhost/api/admin/reports?sortBy=status&order=asc&page=2&limit=5",
    } as Request;

    await GET(req);

    expect(prisma.report.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { status: "asc" },
        skip: 5, // (2 - 1) * 5
        take: 5,
      })
    );
  });
});