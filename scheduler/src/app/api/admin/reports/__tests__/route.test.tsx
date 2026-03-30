/**
 * Testing for admin/reports api route.
 */

import { GET, POST } from "../route";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// Mocks

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      status: init?.status ?? 200,
      json: async () => data,
    }),
  },
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    report: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Helpers

const SUPERUSER_SESSION = { user: { id: "admin1", role: "SUPERUSER" } };
const USER_SESSION = { user: { id: "user1", role: "USER" } };

function makeGetRequest(params: Record<string, string> = {}): Request {
  const url = new URL("http://localhost/api/admin/reports");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return { url: url.toString() } as unknown as Request;
}

function makePostRequest(body: any): Request {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Request;
}

const MOCK_REPORTS = [
  {
    id: "report-1",
    reportedUser: { id: "u1", username: "baduser", isBanned: false, banExpires: null },
    reportedBy: { id: "u2", username: "reporter" },
    handledBy: null,
    createdAt: new Date("2024-01-01"),
    status: "PENDING",
  },
];

// Setup

beforeEach(() => {
  jest.clearAllMocks();
});

// GET tests

describe("GET /api/admin/reports", () => {

  describe("authentication", () => {
    test("returns 403 when session is null", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const res = await GET(makeGetRequest());
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe("Access denied");
    });

    test("returns 403 when user is not SUPERUSER", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(USER_SESSION);

      const res = await GET(makeGetRequest());
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toBe("Access denied");
    });

    test("allows access for SUPERUSER", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(SUPERUSER_SESSION);
      (prisma.report.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.report.count as jest.Mock).mockResolvedValue(0);

      const res = await GET(makeGetRequest());

      expect(res.status).toBe(200);
    });
  });


  describe("default query behaviour", () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue(SUPERUSER_SESSION);
      (prisma.report.findMany as jest.Mock).mockResolvedValue(MOCK_REPORTS);
      (prisma.report.count as jest.Mock)
        .mockResolvedValueOnce(1)   // filtered count
        .mockResolvedValueOnce(5);  // total count
    });

    test("returns reports with pagination metadata", async () => {
      const res = await GET(makeGetRequest());
      const data = await res.json();

      expect(data.reports).toEqual(MOCK_REPORTS);
      expect(data.totalPages).toBe(1);
      expect(data.totalReports).toBe(5);
      expect(data.totalMatchingReports).toBe(1);
    });

    test("uses default sort by createdAt desc", async () => {
      await GET(makeGetRequest());

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      );
    });

    test("uses default page 1 and limit 10", async () => {
      await GET(makeGetRequest());

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      );
    });

    test("includes correct relations in query", async () => {
      await GET(makeGetRequest());

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            reportedUser: {
              select: { id: true, username: true, isBanned: true, banExpires: true },
            },
            reportedBy: {
              select: { id: true, username: true },
            },
            handledBy: {
              select: { id: true, username: true },
            },
          },
        })
      );
    });
  });


  describe("query parameters", () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue(SUPERUSER_SESSION);
      (prisma.report.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.report.count as jest.Mock).mockResolvedValue(0);
    });

    test("respects custom sortBy param", async () => {
      await GET(makeGetRequest({ sortBy: "status" }));

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { status: "desc" } })
      );
    });

    test("respects order=asc param", async () => {
      await GET(makeGetRequest({ order: "asc" }));

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: "asc" } })
      );
    });

    test("defaults order to desc for any value other than asc", async () => {
      await GET(makeGetRequest({ order: "random" }));

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: "desc" } })
      );
    });

    test("respects page and limit params", async () => {
      await GET(makeGetRequest({ page: "3", limit: "5" }));

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 })
      );
    });

    test("calculates totalPages correctly", async () => {
      (prisma.report.count as jest.Mock)
        .mockResolvedValueOnce(25)  // filtered count
        .mockResolvedValueOnce(50); // total

      const res = await GET(makeGetRequest({ limit: "10" }));
      const data = await res.json();

      expect(data.totalPages).toBe(3); // Math.ceil(25/10)
    });
  });


  describe("date filtering", () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue(SUPERUSER_SESSION);
      (prisma.report.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.report.count as jest.Mock).mockResolvedValue(0);
    });

    test("applies startDate filter", async () => {
      await GET(makeGetRequest({ startDate: "2024-01-01" }));

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: new Date("2024-01-01"),
            }),
          }),
        })
      );
    });

    test("applies endDate filter", async () => {
      await GET(makeGetRequest({ endDate: "2024-12-31" }));

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              lte: new Date("2024-12-31"),
            }),
          }),
        })
      );
    });

    test("applies both startDate and endDate together", async () => {
      await GET(makeGetRequest({ startDate: "2024-01-01", endDate: "2024-12-31" }));

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date("2024-01-01"),
              lte: new Date("2024-12-31"),
            },
          }),
        })
      );
    });

    test("does not include createdAt filter when no dates provided", async () => {
      await GET(makeGetRequest());

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
    });
  });


  describe("status filtering", () => {
    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue(SUPERUSER_SESSION);
      (prisma.report.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.report.count as jest.Mock).mockResolvedValue(0);
    });

    test("applies status filter uppercased", async () => {
      await GET(makeGetRequest({ status: "pending" }));

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "PENDING" }),
        })
      );
    });

    test("uppercases status regardless of input case", async () => {
      await GET(makeGetRequest({ status: "resolved" }));

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "RESOLVED" }),
        })
      );
    });

    test("does not include status in where when not provided", async () => {
      await GET(makeGetRequest());

      const call = (prisma.report.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where.status).toBeUndefined();
    });
  });
});

// POST tests

describe("POST /api/admin/reports", () => {

  describe("authentication", () => {
    test("returns 401 when session is null", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const res = await POST(makePostRequest({ reportedUserId: "u2", reason: "spam", description: "" }));
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    test("returns 401 when session has no user", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: null });

      const res = await POST(makePostRequest({ reportedUserId: "u2", reason: "spam", description: "" }));
      const data = await res.json();

      expect(res.status).toBe(401);
    });
  });


  describe("self-report prevention", () => {
    test("returns 400 when user tries to report themselves", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(USER_SESSION);

      const res = await POST(makePostRequest({
        reportedUserId: "user1", // same as USER_SESSION.user.id
        reason: "spam",
        description: "",
      }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("You cannot report yourself.");
    });
  });


  describe("duplicate report prevention", () => {
    test("returns 409 when report already exists", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(USER_SESSION);
      (prisma.report.findFirst as jest.Mock).mockResolvedValue({ id: "existing-report" });

      const res = await POST(makePostRequest({
        reportedUserId: "u2",
        reason: "spam",
        description: "",
      }));
      const data = await res.json();

      expect(res.status).toBe(409);
      expect(data.error).toBe("You have already reported this user.");
    });

    test("checks for existing report with correct where clause", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(USER_SESSION);
      (prisma.report.findFirst as jest.Mock).mockResolvedValue({ id: "existing" });

      await POST(makePostRequest({ reportedUserId: "u2", reason: "spam", description: "" }));

      expect(prisma.report.findFirst).toHaveBeenCalledWith({
        where: {
          reportedUserId: "u2",
          reportedById: "user1",
        },
      });
    });
  });


  describe("successful creation", () => {
    const CREATED_REPORT = {
      id: "new-report",
      reportedUserId: "u2",
      reportedById: "user1",
      reason: "spam",
      description: "sent too many messages",
    };

    beforeEach(() => {
      (getServerSession as jest.Mock).mockResolvedValue(USER_SESSION);
      (prisma.report.findFirst as jest.Mock).mockResolvedValue(null); // no existing report
      (prisma.report.create as jest.Mock).mockResolvedValue(CREATED_REPORT);
    });

    test("creates and returns the report", async () => {
      const res = await POST(makePostRequest({
        reportedUserId: "u2",
        reason: "spam",
        description: "sent too many messages",
      }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual(CREATED_REPORT);
    });

    test("creates report with correct data", async () => {
      await POST(makePostRequest({
        reportedUserId: "u2",
        reason: "spam",
        description: "sent too many messages",
      }));

      expect(prisma.report.create).toHaveBeenCalledWith({
        data: {
          reportedUserId: "u2",
          reportedById: "user1",
          reason: "spam",
          description: "sent too many messages",
        },
      });
    });

    test("does not create report when duplicate exists", async () => {
      (prisma.report.findFirst as jest.Mock).mockResolvedValue({ id: "existing" });

      await POST(makePostRequest({ reportedUserId: "u2", reason: "spam", description: "" }));

      expect(prisma.report.create).not.toHaveBeenCalled();
    });

    test("does not create report when user reports themselves", async () => {
      await POST(makePostRequest({ reportedUserId: "user1", reason: "spam", description: "" }));

      expect(prisma.report.create).not.toHaveBeenCalled();
    });
  });
});