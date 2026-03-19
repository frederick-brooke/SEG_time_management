// src/app/api/admin/appeals/tests/appeals.route.test.ts

import { GET } from "../route";
import { prisma } from "@/lib/prisma";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data) => ({
      status: 200,
      json: async () => data,
    })),
  },
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    appeal: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe("GET /api/admin/appeals", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAppeals = [
    { id: "1", status: "PENDING" },
    { id: "2", status: "APPROVED" },
  ];

  test("returns appeals with default pagination", async () => {
    (prisma.appeal.findMany as jest.Mock).mockResolvedValue(mockAppeals);
    (prisma.appeal.count as jest.Mock).mockResolvedValue(2);

    const req = {
      url: "http://localhost/api/admin/appeals",
    } as Request;

    const res = await GET(req);
    const data = await res.json();

    expect(prisma.appeal.findMany).toHaveBeenCalledWith({
      where: {},
      skip: 0,
      take: 10,
      include: { user: true, report: true, handledBy: true },
      orderBy: { createdAt: "desc" },
    });

    expect(prisma.appeal.count).toHaveBeenCalledWith({ where: {} });

    expect(data.totalAppeals).toBe(2);
    expect(data.totalAppealPages).toBe(1);
  });

  test("applies pagination correctly", async () => {
    (prisma.appeal.findMany as jest.Mock).mockResolvedValue(mockAppeals);
    (prisma.appeal.count as jest.Mock).mockResolvedValue(20);

    const req = {
      url: "http://localhost/api/admin/appeals?page=2&limit=5",
    } as Request;

    await GET(req);

    expect(prisma.appeal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
      })
    );
  });

  test("filters by status", async () => {
    (prisma.appeal.findMany as jest.Mock).mockResolvedValue(mockAppeals);
    (prisma.appeal.count as jest.Mock).mockResolvedValue(2);

    const req = {
      url: "http://localhost/api/admin/appeals?status=PENDING",
    } as Request;

    await GET(req);

    expect(prisma.appeal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "PENDING" },
      })
    );
  });

  test("filters by startDate", async () => {
    (prisma.appeal.findMany as jest.Mock).mockResolvedValue(mockAppeals);
    (prisma.appeal.count as jest.Mock).mockResolvedValue(2);

    const req = {
      url: "http://localhost/api/admin/appeals?startDate=2024-01-01",
    } as Request;

    await GET(req);

    expect(prisma.appeal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          createdAt: {
            gte: new Date("2024-01-01"),
          },
        },
      })
    );
  });

  test("filters by endDate", async () => {
    (prisma.appeal.findMany as jest.Mock).mockResolvedValue(mockAppeals);
    (prisma.appeal.count as jest.Mock).mockResolvedValue(2);

    const req = {
      url: "http://localhost/api/admin/appeals?endDate=2024-12-31",
    } as Request;

    await GET(req);

    expect(prisma.appeal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          createdAt: {
            lte: new Date("2024-12-31"),
          },
        },
      })
    );
  });

  test("applies sorting", async () => {
    (prisma.appeal.findMany as jest.Mock).mockResolvedValue(mockAppeals);
    (prisma.appeal.count as jest.Mock).mockResolvedValue(2);

    const req = {
      url: "http://localhost/api/admin/appeals?sortBy=status&order=asc",
    } as Request;

    await GET(req);

    expect(prisma.appeal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { status: "asc" },
      })
    );
  });
});