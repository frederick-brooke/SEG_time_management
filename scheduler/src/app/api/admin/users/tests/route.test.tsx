import { GET } from "../route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";


// ✅ Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// ✅ Mock next-auth
jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

// ✅ Mock cookies
jest.mock("next/headers", () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn(),
  }),
}));

// ✅ Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}));

describe("GET /api/admin (users list)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 if no session", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = { url: "http://localhost/api/admin" } as Request;

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("No session found. Please log in.");
  });

  it("returns 403 if not SUPERUSER", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: "USER" },
    });

    const req = { url: "http://localhost/api/admin" } as Request;

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toContain("Access denied");
  });

  it("returns users with default params", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: "SUPERUSER" },
    });

    (prisma.user.count as jest.Mock)
      .mockResolvedValueOnce(50) // totalUsers
      .mockResolvedValueOnce(20); // totalMatchingUsers

    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

    const req = { url: "http://localhost/api/admin" } as Request;

    const res = await GET(req);
    const data = await res.json();

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        orderBy: { createdAt: "desc" },
        skip: 0,
        take: 10,
      })
    );

    expect(data.totalPages).toBe(2); // 20 / 10
  });

  it("applies search filter", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: "SUPERUSER" },
    });

    (prisma.user.count as jest.Mock)
      .mockResolvedValueOnce(50)
      .mockResolvedValueOnce(5);

    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

    const req = {
      url: "http://localhost/api/admin?search=john",
    } as Request;

    await GET(req);

    expect(prisma.user.count).toHaveBeenLastCalledWith({
      where: {
        username: {
          contains: "john",
          mode: "insensitive",
        },
      },
    });
  });

  it("applies date filter", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: "SUPERUSER" },
    });

    (prisma.user.count as jest.Mock)
      .mockResolvedValueOnce(50)
      .mockResolvedValueOnce(10);

    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

    const req = {
      url:
        "http://localhost/api/admin?startDate=2024-01-01&endDate=2024-01-31",
    } as Request;

    await GET(req);

    expect(prisma.user.count).toHaveBeenLastCalledWith({
      where: {
        createdAt: {
          gte: new Date("2024-01-01"),
          lte: new Date("2024-01-31"),
        },
      },
    });
  });

  it("applies category filter", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: "SUPERUSER" },
    });

    (prisma.user.count as jest.Mock)
      .mockResolvedValueOnce(50)
      .mockResolvedValueOnce(3);

    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

    const req = {
      url: "http://localhost/api/admin?categories=user,superuser",
    } as Request;

    await GET(req);

    expect(prisma.user.count).toHaveBeenLastCalledWith({
      where: {
        role: {
          in: ["USER", "SUPERUSER"],
        },
      },
    });
  });

  it("applies pagination and sorting", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { role: "SUPERUSER" },
    });

    (prisma.user.count as jest.Mock)
      .mockResolvedValueOnce(50)
      .mockResolvedValueOnce(30);

    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

    const req = {
      url:
        "http://localhost/api/admin?sortBy=username&order=asc&page=2&limit=5",
    } as Request;

    await GET(req);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { username: "asc" },
        skip: 5,
        take: 5,
      })
    );
  });
});