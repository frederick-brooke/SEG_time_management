import { NextResponse } from "next/server";
import { GET } from "./route";
import prisma from "@/lib/prisma";

//  Mocks 

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    user:   { count: jest.fn() },
    report: { count: jest.fn() },
    appeal: { count: jest.fn() },
  },
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body, init?) => ({ body, init })),
  },
}));

//  Setup

beforeEach(() => jest.clearAllMocks());

// Success 

describe("GET /api/admin/stats — success", () => {
  beforeEach(() => {
    (prisma.user.count   as jest.Mock).mockResolvedValue(10);
    (prisma.report.count as jest.Mock).mockResolvedValue(5);
    (prisma.appeal.count as jest.Mock).mockResolvedValue(3);
  });

  test("runs all three count queries concurrently", async () => {
    await GET();
    expect(prisma.user.count).toHaveBeenCalledTimes(1);
    expect(prisma.report.count).toHaveBeenCalledTimes(1);
    expect(prisma.appeal.count).toHaveBeenCalledTimes(1);
  });

  test("returns the aggregated stats as JSON", async () => {
    await GET();
    expect(NextResponse.json).toHaveBeenCalledWith({
      totalUsers: 10,
      totalReports: 5,
      totalAppeals: 3,
    });
  });

  test("does not include a status code on success", async () => {
    await GET();
    const call = (NextResponse.json as jest.Mock).mock.calls[0];
    expect(call[1]).toBeUndefined();
  });
});

// Error 

describe("GET /api/admin/stats — error", () => {
  beforeEach(() => {
    (prisma.user.count as jest.Mock).mockRejectedValue(new Error("DB failure"));
  });

  test("returns a 500 error response on failure", async () => {
    await GET();
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Failed to fetch admin statistics" },
      { status: 500 }
    );
  });

  test("logs the error to console", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await GET();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  test("does not throw — always returns a response", async () => {
    await expect(GET()).resolves.toBeDefined();
  });
});