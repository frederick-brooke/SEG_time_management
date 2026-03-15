import { GET } from "@/app/api/admin/appeals/route";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    appeal: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any) => ({
      json: async () => data,
    }),
  },
}));

describe("GET /api/appeals", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns paginated appeals with total count", async () => {
    const mockAppeals = [
      {
        id: "1",
        createdAt: new Date(),
        user: { id: "u1", name: "Test User" },
        report: { id: "r1" },
      },
    ];

    (prisma.appeal.findMany as jest.Mock).mockResolvedValue(mockAppeals);
    (prisma.appeal.count as jest.Mock).mockResolvedValue(25);

    const req = {
      url: "http://localhost/api/appeals?page=2&limit=10",
    } as Request;

    const response = await GET(req);
    const data = await response.json();

    expect(prisma.appeal.findMany).toHaveBeenCalledWith({
      skip: 10, // (2 - 1) * 10
      take: 10,
      include: { user: true, report: true },
      orderBy: { createdAt: "desc" },
    });

    expect(prisma.appeal.count).toHaveBeenCalled();

    expect(data).toEqual({
      appeals: mockAppeals,
      totalAppeals: 25,
      totalAppealPages: 3, // Math.ceil(25 / 10)
    });
  });

  it("uses default page and limit if not provided", async () => {
    (prisma.appeal.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.appeal.count as jest.Mock).mockResolvedValue(0);

    const req = {
      url: "http://localhost/api/appeals",
    } as Request;

    const response = await GET(req);
    const data = await response.json();

    expect(prisma.appeal.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 10,
      include: { user: true, report: true },
      orderBy: { createdAt: "desc" },
    });

    expect(data.totalAppealPages).toBe(0);
  });
});