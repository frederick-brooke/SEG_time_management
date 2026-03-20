import { POST } from "../route";
import { getServerSession } from "next-auth";
import { prisma } from "lib/prisma";

// mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      status: init?.status || 200,
      json: async () => data,
    }),
  },
}));

// Mock next-auth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Mock prisma
jest.mock("../../../../lib/prisma", () => ({
  prisma: {
    report: {
      create: jest.fn(),
    },
  },
}));

describe("POST /api/report", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRequest = (body: any) =>
    ({
      json: jest.fn().mockResolvedValue(body),
    } as unknown as Request);

  //Unauthorized
  it("returns 401 if no session", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const req = mockRequest({});
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  //Missing fields
  it("returns 400 if required fields are missing", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user1" },
    });

    const req = mockRequest({ reason: "spam" }); // missing reportedUserId
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Missing mandatory fields!");
  });

  // Success
  it("creates a report successfully", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user1" },
    });

    const mockReport = {
      id: "r1",
      reportedUserId: "u2",
      reportedById: "user1",
      reason: "spam",
      description: "bad behavior",
    };

    (prisma.report.create as jest.Mock).mockResolvedValue(mockReport);

    const req = mockRequest({
      reportedUserId: "u2",
      reason: "spam",
      description: "bad behavior",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(prisma.report.create).toHaveBeenCalledWith({
      data: {
        reportedUserId: "u2",
        reportedById: "user1",
        reason: "spam",
        description: "bad behavior",
      },
    });

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.report).toEqual(mockReport);
  });

  // checks DB failure
  it("returns 500 if database fails", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: "user1" },
    });

    (prisma.report.create as jest.Mock).mockRejectedValue(
      new Error("DB error")
    );

    const req = mockRequest({
      reportedUserId: "u2",
      reason: "spam",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Failed to create report");
  });
});