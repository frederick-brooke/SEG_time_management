import { GET } from "../route"; // Adjust this import to match your actual file name
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
    // Clear mocks before each test to prevent state leakage
    jest.clearAllMocks();
    
    // Create a dummy NextRequest (Node 18+ has built-in Request)
    req = new Request("http://localhost/api/exams") as NextRequest;
  });

  it("should return 401 Unauthorized if the user is not logged in", async () => {
    // Arrange: Simulate no active session
    mockedGetServerSession.mockResolvedValueOnce(null);

    // Act
    const response = await GET(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
    expect(mockedGetServerSession).toHaveBeenCalledTimes(1);
    expect(mockedPrismaFindMany).not.toHaveBeenCalled();
  });

  it("should return 401 Unauthorized if session exists but user ID is missing", async () => {
    // Arrange: Simulate session missing user.id
    mockedGetServerSession.mockResolvedValueOnce({
      user: { name: "Test User", email: "test@example.com" },
    });

    // Act
    const response = await GET(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("should return 200 and a list of exams for the authenticated user", async () => {
    // Arrange: Simulate an authenticated user
    const mockUserId = "user-123";
    mockedGetServerSession.mockResolvedValueOnce({
      user: { id: mockUserId, name: "Test User" },
    });

    // Arrange: Simulate the Prisma database response
    const mockExams = [
      { id: "exam-1", title: "Math", examDate: new Date(), tasks: [], revisionMaterials: [] },
      { id: "exam-2", title: "Science", examDate: new Date(), tasks: [], revisionMaterials: [] },
    ];
    mockedPrismaFindMany.mockResolvedValueOnce(mockExams);

    // Act
    const response = await GET(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toEqual({ exams: mockExams });
    
    // Ensure Prisma was called with the correct user ID and constraints
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
    // Arrange: Simulate an authenticated user
    mockedGetServerSession.mockResolvedValueOnce({
      user: { id: "user-123" },
    });

    // Arrange: Simulate a database error
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockedPrismaFindMany.mockRejectedValueOnce(new Error("Database connection failed"));

    // Act
    const response = await GET(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Failed to fetch exams" });
    
    // Verify error was logged (and clean up the spy)
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});