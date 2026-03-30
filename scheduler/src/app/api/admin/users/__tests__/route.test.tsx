/**
 * Testing for admin/users api route
 */

import { GET } from "../route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";

// Mocks 

jest.mock("@/lib/auth", () => ({ authOptions: {} }));

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      count:    jest.fn(),
    },
  },
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      json:   async () => data,
      status: init?.status ?? 200,
    }),
  },
}));

// Helpers 

const mockSession = (role = "SUPERUSER") =>
  (getServerSession as jest.Mock).mockResolvedValue({ user: { role } });

const mockDB = (users: any[] = [], count = 0) => {
  (prisma.user.findMany as jest.Mock).mockResolvedValue(users);
  (prisma.user.count   as jest.Mock).mockResolvedValue(count);
};

const get = (path = "") =>
  GET({ url: `http://localhost/api/admin${path}` } as Request);

// Tests 

describe("GET /api/admin/users", () => {
  beforeEach(() => jest.clearAllMocks());

  // Auth guards 
  describe("auth", () => {
    it("returns 401 when there is no session", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const res  = await get();
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("No session found. Please log in.");
    });

    it("returns 403 when the role is USER", async () => {
      mockSession("USER");

      const res  = await get();
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toContain("Access denied");
      expect(data.currentRole).toBe("USER");
    });

    it("returns 403 when the role is ADMIN", async () => {
      mockSession("ADMIN");

      const res = await get();
      expect((await res.json()).error).toContain("Access denied");
    });
  });

  // Default params 
  describe("default params", () => {
    it("queries with correct defaults and returns pagination", async () => {
      mockSession();
      mockDB([], 25);

      const res  = await get();
      const data = await res.json();

      expect(res.status).toBe(200);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where:   {},
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
          skip:    0,
          take:    10,
        })
      );

      expect(prisma.user.count).toHaveBeenCalledWith({ where: {} });

      // Math.ceil(25/10) = 3
      expect(data.totalUsers).toBe(25);
      expect(data.totalUserPages).toBe(3);
    });

    it("includes _count on each user", async () => {
      mockSession();
      mockDB([], 0);

      await get();

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            _count: {
              select: {
                reportsMade:     true,
                reportsReceived: true,
                appeals:         true,
              },
            },
          },
        })
      );
    });
  });

  // Search filter 
  describe("search filter", () => {
    it("adds case-insensitive username contains filter", async () => {
      mockSession();
      mockDB([], 2);

      await get("?search=john");

      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { username: { contains: "john", mode: "insensitive" } },
      });
    });

    it("ignores empty search string", async () => {
      mockSession();
      mockDB([], 0);

      await get("?search=");

      expect(prisma.user.count).toHaveBeenCalledWith({ where: {} });
    });
  });

  // Date filter 
  describe("date filter", () => {
    it("applies gte and lte when both dates are provided", async () => {
      mockSession();
      mockDB([], 0);

      await get("?startDate=2024-01-01&endDate=2024-01-31");

      expect(prisma.user.count).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: new Date("2024-01-01"),
            lte: new Date("2024-01-31"),
          },
        },
      });
    });

    it("applies only gte when only startDate is provided", async () => {
      mockSession();
      mockDB([], 0);

      await get("?startDate=2024-06-01");

      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { createdAt: { gte: new Date("2024-06-01") } },
      });
    });

    it("ignores invalid date strings", async () => {
      mockSession();
      mockDB([], 0);

      await get("?startDate=not-a-date");

      expect(prisma.user.count).toHaveBeenCalledWith({ where: {} });
    });
  });

  // Category filter 
  describe("category filter", () => {
    it("uppercases and filters by role", async () => {
      mockSession();
      mockDB([], 0);

      await get("?categories=user,superuser");

      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { role: { in: ["USER", "SUPERUSER"] } },
      });
    });

    it("ignores empty categories param", async () => {
      mockSession();
      mockDB([], 0);

      await get("?categories=");

      expect(prisma.user.count).toHaveBeenCalledWith({ where: {} });
    });
  });

  // Sorting 
  describe("sorting", () => {
    it("sorts by username asc when specified", async () => {
      mockSession();
      mockDB([], 0);

      await get("?sortBy=username&order=asc");

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ username: "asc" }, { id: "asc" }],
        })
      );
    });

    it("falls back to createdAt for disallowed sortBy values", async () => {
      mockSession();
      mockDB([], 0);

      await get("?sortBy=password");

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        })
      );
    });

    it("defaults to desc when order is not 'asc'", async () => {
      mockSession();
      mockDB([], 0);

      await get("?order=invalid");

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        })
      );
    });
  });

  // Pagination 
  describe("pagination", () => {
    it("calculates skip correctly for page 2 limit 5", async () => {
      mockSession();
      mockDB([], 30);

      await get("?page=2&limit=5");

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 })
      );
    });

    it("returns correct totalUserPages", async () => {
      mockSession();
      mockDB([], 33);

      const data = await (await get("?limit=10")).json();

      // Math.ceil(33/10) = 4
      expect(data.totalUserPages).toBe(4);
    });

    it("returns page 1 skip 0 by default", async () => {
      mockSession();
      mockDB([], 0);

      await get();

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 })
      );
    });
  });

  // Response shape 
  describe("response shape", () => {
    it("returns users array in response", async () => {
      const users = [{ id: "1", username: "alice" }];
      mockSession();
      mockDB(users, 1);

      const data = await (await get()).json();

      expect(data.users).toEqual(users);
    });
  });
});