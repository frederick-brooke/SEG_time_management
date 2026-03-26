import { GET } from "./route";
import { prisma } from "lib/prisma";

jest.mock("lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("next/server", () => {
  return {
    NextResponse: {
      json: jest.fn((body, init) => {
        return {
          status: init?.status || 200,
          json: async () => body,
        };
      }),
    },
  };
});

describe("GET /api/profile/[username]", () => {
  let req: Request;

  beforeEach(() => {
    jest.clearAllMocks();
    req = new Request("http://localhost");
  });

  it("returns 400 if username is missing", async () => {
    const res = await GET(req, { params: Promise.resolve({ username: "" }) });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Username required");
  });

  it("returns 404 if user is not found", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await GET(req, { params: Promise.resolve({ username: "ghost" }) });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("User not found");
  });

  it("returns 200 and the user data on success", async () => {
    const mockUser = {
      id: "123",
      email: "test@test.com",
      username: "realuser",
    };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    
    const res = await GET(req, { params: Promise.resolve({ username: "realuser" }) });
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.user).toEqual(mockUser);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { username: "realuser" },
      select: expect.any(Object),
    });
  });

  it("returns 500 on database error", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error("DB Crash"));
    
    const res = await GET(req, { params: Promise.resolve({ username: "erroruser" }) });
    expect(res.status).toBe(500);
    
    const data = await res.json();
    expect(data.error).toBe("Server error");
    
    consoleSpy.mockRestore();
  });
});