import { GET } from "./route";
import { getServerSession } from "next-auth/next";
import { fetchFriends } from "@/lib/profile-queries";

// Mock NextResponse so it works in Jest's jsdom environment,
// which lacks the native Response.json static method that Next.js relies on.
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(body), {
        ...init,
        headers: { "Content-Type": "application/json" },
      }),
  },
}));

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));
jest.mock("@/lib/profile-queries", () => ({
  fetchFriends: jest.fn(),
}));
jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

describe("GET /api/friends", () => {
  const createMockRequest = () =>
    ({
      url: "http://localhost/api/friends",
      method: "GET",
      headers: new Headers(),
    } as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when the user is not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const response = await GET(createMockRequest());

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.message).toBe("Not authenticated");
    expect(fetchFriends).not.toHaveBeenCalled();
  });

  it("returns 401 when the session exists but has no user ID", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: "Test User" },
    });

    const response = await GET(createMockRequest());

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.message).toBe("Not authenticated");
  });

  it("returns 200 and the friends list when the user is authenticated", async () => {
    const mockUserId = "user-123";
    const mockFriendsList = [
      { id: "friend-1", name: "Alice", location: "London" },
      { id: "friend-2", name: "Bob", location: "New York" },
    ];

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: mockUserId },
    });
    (fetchFriends as jest.Mock).mockResolvedValue(mockFriendsList);

    const response = await GET(createMockRequest());

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockFriendsList);
    expect(fetchFriends).toHaveBeenCalledWith(mockUserId);
  });

  it("returns 500 when fetchFriends throws an error", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const mockUserId = "user-123";
    const errorMessage = "Database connection failed";

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: mockUserId },
    });
    (fetchFriends as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const response = await GET(createMockRequest());

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.message).toBe("Failed to fetch friends");
    expect(data.error).toBe(errorMessage);

    consoleSpy.mockRestore();
  });
});