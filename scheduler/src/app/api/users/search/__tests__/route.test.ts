/**
 * Testing for users search
 */

import { GET } from "../route";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";

// Mocks

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      status: init?.status || 200,
      json: async () => data,
    }),
  },
}));

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn(),
  }),
}));

// Tests

describe("GET /api/admin/users (search)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSession = {
    user: {
      id: "admin1",
      username: "adminUser",
    },
  };

  it("returns 401 if no session", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = new Request("http://localhost/api/admin/users?search=test");

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("No session found. Please log in.");
  });

  it("returns empty result if search is empty", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    const req = new Request("http://localhost/api/admin/users?search=");

    const res = await GET(req);
    const data = await res.json();

    expect(data).toEqual({
      users: [],
      totalUsers: 0,
      totalUserPages: 0,
    });

    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it("applies search filter", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.user.count as jest.Mock).mockResolvedValue(20);

    const req = new Request("http://localhost/api/admin/users?search=john");

    const res = await GET(req);
    const data = await res.json();

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              username: {
                contains: "john",
                mode: "insensitive",
              },
            }),
          ]),
        }),
      })
    );

    expect(data.totalUserPages).toBe(2);
  });

  it("applies pagination and sorting", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.user.count as jest.Mock).mockResolvedValue(24);

    const req = new Request(
      "http://localhost/api/admin/users?search=test&page=2&limit=12&sortBy=username&order=asc"
    );

    await GET(req);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { username: "asc" },
        skip: 12,
        take: 12,
      })
    );
  });

  it("applies date and category filters", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.user.count as jest.Mock).mockResolvedValue(5);

    const req = new Request(
      "http://localhost/api/admin/users?search=test&startDate=2024-01-01&endDate=2024-12-31&categories=admin,user"
    );

    await GET(req);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              createdAt: expect.objectContaining({
                gte: expect.any(Date),
                lte: expect.any(Date),
              }),
            }),
            expect.objectContaining({
              role: { in: ["ADMIN", "USER"] },
            }),
          ]),
        }),
      })
    );
  });
});