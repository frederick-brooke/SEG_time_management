import { GET } from "../route"; 
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// 1. Mock the dependencies
jest.mock("next/server", () => ({
  ...jest.requireActual("next/server"),
  NextResponse: {
    json: jest.fn().mockImplementation((body, init) => {
      return {
        status: init?.status || 200,
        json: async () => body,
      };
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
    exam: {
      findMany: jest.fn(),
    },
  },
}));

// Provide type aliases for mocked functions to help TypeScript
const mockedGetServerSession = getServerSession as jest.Mock;
const mockedPrismaFindMany = prisma.exam.findMany as jest.Mock;

describe("GET /api/exams", () => {
  let req: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = new Request("http://localhost/api/exams") as NextRequest;
  });

  it("should return 401 Unauthorized if the user is not logged in", async () => {
    mockedGetServerSession.mockResolvedValueOnce(null);

    // Act
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
    expect(mockedGetServerSession).toHaveBeenCalledTimes(1);
    expect(mockedPrismaFindMany).not.toHaveBeenCalled();
  });

  it("should return 401 Unauthorized if session exists but user ID is missing", async () => {
    mockedGetServerSession.mockResolvedValueOnce({
      user: { name: "Test User", email: "test@example.com" },
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("should return 200 and a list of exams for the authenticated user", async () => {
    const mockUserId = "user-123";
    mockedGetServerSession.mockResolvedValueOnce({
      user: { id: mockUserId, name: "Test User" },
    });

    const mockExams = [
      { id: "exam-1", title: "Math", examDate: new Date(), tasks: [], revisionMaterials: [] },
      { id: "exam-2", title: "Science", examDate: new Date(), tasks: [], revisionMaterials: [] },
    ];
    mockedPrismaFindMany.mockResolvedValueOnce(mockExams);

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ exams: mockExams });
    
    expect(mockedPrismaFindMany).toHaveBeenCalledWith({
      where: { userId: mockUserId },
      include: {
        tasks: true,
        revisionMaterials: true,
      },
      orderBy: { examDate: "asc" },
    });
  });

  it("should return 500 if the database query fails", async () => {
    mockedGetServerSession.mockResolvedValueOnce({
      user: { id: "user-123" },
    });

    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockedPrismaFindMany.mockRejectedValueOnce(new Error("Database connection failed"));

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Failed to fetch exams" });
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});