import { POST, DELETE, PATCH } from "./route";

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
jest.mock("@/src/lib/prisma", () => ({
  prisma: {
    message: {
      create: jest.fn(),
    },
    conversation: {
      update: jest.fn(),
    },
    conversationParticipant: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));
jest.mock("pusher", () =>
  jest.fn().mockImplementation(() => ({
    trigger: (...args: any[]) => mockTrigger(...args),
  }))
);

import { getServerSession } from "next-auth";
import { prisma } from "@/src/lib/prisma";

const makeParams = (conversationId: string) => Promise.resolve({ conversationId });
const makeRequest = (method: string, body?: object) =>
  new Request("http://localhost/api/conversations/conv-1/messages", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }) as any;

const mockMessage = {
  id: "msg-1",
  content: "Hello",
  createdAt: new Date("2024-01-01T10:00:00Z"),
  conversationId: "conv-1",
  senderId: "user-1",
  sender: { id: "user-1", username: "alice", pfp: null },
};

const mockParticipant = {
  id: "participant-1",
  conversationId: "conv-1",
  userId: "user-1",
  role: "member",
  joinedAt: new Date("2024-01-01"),
  deletedAt: null,
  lastReadAt: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockTrigger = jest.fn().mockResolvedValue({});
  jest.mocked(getServerSession).mockResolvedValue({ user: { id: "user-1" } });
  jest.mocked(prisma.message.create).mockResolvedValue(mockMessage);
  jest.mocked(prisma.conversation.update).mockResolvedValue({} as any);
  jest.mocked(prisma.conversationParticipant.findMany).mockResolvedValue([
    { userId: "user-1" },
    { userId: "user-2" },
  ] as any);
  jest.mocked(prisma.conversationParticipant.findFirst).mockResolvedValue(mockParticipant);
  jest.mocked(prisma.conversationParticipant.updateMany).mockResolvedValue({ count: 1 });
});

describe("POST /api/conversations/[conversationId]/messages", () => {
  describe("authentication", () => {
    it("returns 401 when there is no session", async () => {
      jest.mocked(getServerSession).mockResolvedValue(null);
      const res = await POST(makeRequest("POST", { content: "Hello" }), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("validation", () => {
    it("returns 400 when content is missing", async () => {
      const res = await POST(makeRequest("POST", {}), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toBe("Missing content or conversationId");
    });

    it("returns 400 when body is invalid JSON", async () => {
      const req = new Request("http://localhost/api/conversations/conv-1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      }) as any;
      const res = await POST(req, { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid JSON body");
    });
  });

  describe("success", () => {
    it("returns the created message", async () => {
      const res = await POST(makeRequest("POST", { content: "Hello" }), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.id).toBe("msg-1");
      expect(data.content).toBe("Hello");
    });

    it("creates the message with the correct data", async () => {
      await POST(makeRequest("POST", { content: "Hello" }), { params: makeParams("conv-1") });
      expect(prisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: "Hello",
            conversationId: "conv-1",
            senderId: "user-1",
          }),
        })
      );
    });

    it("updates the conversation last message preview", async () => {
      await POST(makeRequest("POST", { content: "Hello" }), { params: makeParams("conv-1") });
      expect(prisma.conversation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "conv-1" },
          data: expect.objectContaining({ lastMessage: "Hello" }),
        })
      );
    });

    it("triggers Pusher on the conversation channel", async () => {
      await POST(makeRequest("POST", { content: "Hello" }), { params: makeParams("conv-1") });
      expect(mockTrigger).toHaveBeenCalledWith(
        "conversation-conv-1",
        "new-message",
        expect.any(Object)
      );
    });

    it("notifies each participant's sidebar via Pusher", async () => {
      await POST(makeRequest("POST", { content: "Hello" }), { params: makeParams("conv-1") });
      expect(mockTrigger).toHaveBeenCalledWith(
        "user-user-1",
        "conversation-updated",
        expect.any(Object)
      );
      expect(mockTrigger).toHaveBeenCalledWith(
        "user-user-2",
        "conversation-updated",
        expect.any(Object)
      );
    });
  });

  describe("error handling", () => {
    it("returns 500 when the database throws", async () => {
      jest.mocked(prisma.message.create).mockRejectedValue(new Error("DB error"));
      const res = await POST(makeRequest("POST", { content: "Hello" }), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(500);
      expect(data.error).toBe("Server error");
    });
  });
});

describe("DELETE /api/conversations/[conversationId]/messages", () => {
  describe("authentication", () => {
    it("returns 401 when there is no session", async () => {
      jest.mocked(getServerSession).mockResolvedValue(null);
      const res = await DELETE(makeRequest("DELETE"), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("not found", () => {
    it("returns 404 when the user is not a participant", async () => {
      jest.mocked(prisma.conversationParticipant.findFirst).mockResolvedValue(null);
      const res = await DELETE(makeRequest("DELETE"), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(404);
      expect(data.error).toBe("Conversation not found");
    });
  });

  describe("success", () => {
    it("returns success: true", async () => {
      const res = await DELETE(makeRequest("DELETE"), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("sets deletedAt on the participant record", async () => {
      await DELETE(makeRequest("DELETE"), { params: makeParams("conv-1") });
      expect(prisma.conversationParticipant.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ conversationId: "conv-1", userId: "user-1" }),
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        })
      );
    });

    it("triggers conversation-deleted Pusher event for the user", async () => {
      await DELETE(makeRequest("DELETE"), { params: makeParams("conv-1") });
      expect(mockTrigger).toHaveBeenCalledWith(
        "user-user-1",
        "conversation-deleted",
        { id: "conv-1" }
      );
    });
  });

  describe("error handling", () => {
    it("returns 500 when the database throws", async () => {
      jest.mocked(prisma.conversationParticipant.updateMany).mockRejectedValue(new Error("DB error"));
      const res = await DELETE(makeRequest("DELETE"), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(500);
      expect(data.error).toBe("Server error");
    });
  });
});

describe("PATCH /api/conversations/[conversationId]/messages", () => {
  describe("authentication", () => {
    it("returns 401 when there is no session", async () => {
      jest.mocked(getServerSession).mockResolvedValue(null);
      const res = await PATCH(makeRequest("PATCH"), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("success", () => {
    it("returns success: true", async () => {
      const res = await PATCH(makeRequest("PATCH"), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("updates lastReadAt for the correct user and conversation", async () => {
      await PATCH(makeRequest("PATCH"), { params: makeParams("conv-1") });
      expect(prisma.conversationParticipant.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { conversationId: "conv-1", userId: "user-1" },
          data: expect.objectContaining({ lastReadAt: expect.any(Date) }),
        })
      );
    });
  });
});