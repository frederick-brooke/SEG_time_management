import { POST } from "../route";

// var needed here because jest.mock is hoisted above const/let declarations
var mockTrigger = jest.fn().mockResolvedValue({});

jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => data,
    })),
  },
}));
jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn(() => ({})),
  getServerSession: jest.fn(),
}));
jest.mock("@/src/lib/auth", () => ({ authOptions: {} }));
jest.mock("pusher", () =>
  jest.fn().mockImplementation(() => ({
    trigger: (...args: any[]) => mockTrigger(...args),
  }))
);

import { getServerSession } from "next-auth";

const makeParams = (conversationId: string) => Promise.resolve({ conversationId });
const makeRequest = (body: object) =>
  new Request("http://localhost/api/conversations/conv-1/typing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as any;

beforeEach(() => {
  jest.clearAllMocks();
  mockTrigger = jest.fn().mockResolvedValue({});
  jest.mocked(getServerSession).mockResolvedValue({ user: { id: "user-1", username: "alice" } });
});

describe("POST /api/conversations/[conversationId]/typing", () => {
  describe("authentication", () => {
    it("returns 401 when there is no session", async () => {
      jest.mocked(getServerSession).mockResolvedValue(null);
      const res = await POST(makeRequest({ isTyping: true }), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 401 when session has no user ID", async () => {
      jest.mocked(getServerSession).mockResolvedValue({ user: {} });
      const res = await POST(makeRequest({ isTyping: true }), { params: makeParams("conv-1") });
      expect(res.status).toBe(401);
    });
  });

  describe("success", () => {
    it("returns ok: true", async () => {
      const res = await POST(makeRequest({ isTyping: true }), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
    });

    it("triggers Pusher on the correct channel", async () => {
      await POST(makeRequest({ isTyping: true }), { params: makeParams("conv-1") });
      expect(mockTrigger).toHaveBeenCalledWith(
        "conversation-conv-1",
        "typing",
        expect.any(Object)
      );
    });

    it("includes userId, username and isTyping in the Pusher payload", async () => {
      await POST(makeRequest({ isTyping: true }), { params: makeParams("conv-1") });
      expect(mockTrigger).toHaveBeenCalledWith(
        expect.any(String),
        "typing",
        expect.objectContaining({
          userId: "user-1",
          username: "alice",
          isTyping: true,
        })
      );
    });

    it("passes isTyping: false correctly", async () => {
      await POST(makeRequest({ isTyping: false }), { params: makeParams("conv-1") });
      expect(mockTrigger).toHaveBeenCalledWith(
        expect.any(String),
        "typing",
        expect.objectContaining({ isTyping: false })
      );
    });
  });

  describe("Pusher fire-and-forget", () => {
    it("still returns ok even if Pusher trigger fails", async () => {
      mockTrigger = jest.fn().mockRejectedValue(new Error("Pusher error"));
      const res = await POST(makeRequest({ isTyping: true }), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
    });
  });
});