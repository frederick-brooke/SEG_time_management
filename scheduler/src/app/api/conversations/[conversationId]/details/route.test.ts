import { GET } from "./route";

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
    conversation: {
      findUnique: jest.fn(),
    },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/src/lib/prisma";

const makeParams = (conversationId: string) => Promise.resolve({ conversationId });
const makeRequest = () => new Request("http://localhost/api/conversations/conv-1") as any;

const mockConversation = {
  id: "conv-1",
  isGroup: true,
  name: "Study Group",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  lastMessage: null,
  lastMessageAt: null,
  createdById: "user-1",
  participants: [
    {
      userId: "user-1",
      role: "admin",
      joinedAt: new Date("2024-01-01"),
      user: { id: "user-1", username: "alice", fname: "Alice", pfp: null },
    },
    {
      userId: "user-2",
      role: "member",
      joinedAt: new Date("2024-01-02"),
      user: { id: "user-2", username: "bob", fname: "Bob", pfp: null },
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getServerSession).mockResolvedValue({ user: { id: "user-1" } });
});

describe("GET /api/conversations/[conversationId]", () => {
  describe("authentication", () => {
    it("returns 401 when there is no session", async () => {
      jest.mocked(getServerSession).mockResolvedValue(null);
      const res = await GET(makeRequest(), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("returns 401 when session has no user ID", async () => {
      jest.mocked(getServerSession).mockResolvedValue({ user: {} });
      const res = await GET(makeRequest(), { params: makeParams("conv-1") });
      expect(res.status).toBe(401);
    });
  });

  describe("validation", () => {
    it("returns 400 for an empty conversation ID", async () => {
      const res = await GET(makeRequest(), { params: makeParams("") });
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid conversation ID");
    });
  });

  describe("success", () => {
    it("returns conversation details with participants", async () => {
      jest.mocked(prisma.conversation.findUnique).mockResolvedValue(mockConversation);
      const res = await GET(makeRequest(), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.id).toBe("conv-1");
      expect(data.name).toBe("Study Group");
      expect(data.participants).toHaveLength(2);
    });

    it("queries with the correct conversationId", async () => {
      jest.mocked(prisma.conversation.findUnique).mockResolvedValue(mockConversation);
      await GET(makeRequest(), { params: makeParams("conv-1") });
      expect(prisma.conversation.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "conv-1" } })
      );
    });

    it("returns participants ordered by joinedAt ascending", async () => {
      jest.mocked(prisma.conversation.findUnique).mockResolvedValue(mockConversation);
      const res = await GET(makeRequest(), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(data.participants[0].role).toBe("admin");
      expect(data.participants[1].role).toBe("member");
    });

    it("includes the correct fields for each participant", async () => {
      jest.mocked(prisma.conversation.findUnique).mockResolvedValue(mockConversation);
      const res = await GET(makeRequest(), { params: makeParams("conv-1") });
      const data = await res.json();
      const participant = data.participants[0];
      expect(participant).toHaveProperty("userId");
      expect(participant).toHaveProperty("role");
      expect(participant).toHaveProperty("joinedAt");
      expect(participant.user).toHaveProperty("id");
      expect(participant.user).toHaveProperty("username");
      expect(participant.user).toHaveProperty("fname");
      expect(participant.user).toHaveProperty("pfp");
    });
  });

  describe("not found / forbidden", () => {
    it("returns 404 when conversation does not exist", async () => {
      jest.mocked(prisma.conversation.findUnique).mockResolvedValue(null);
      const res = await GET(makeRequest(), { params: makeParams("nonexistent") });
      const data = await res.json();
      expect(res.status).toBe(404);
      expect(data.error).toBe("Conversation not found");
    });

    it("returns 403 when the requesting user is not a participant", async () => {
      jest.mocked(getServerSession).mockResolvedValue({ user: { id: "user-99" } });
      jest.mocked(prisma.conversation.findUnique).mockResolvedValue(mockConversation);
      const res = await GET(makeRequest(), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(403);
      expect(data.error).toBe("Forbidden");
    });
  });

  describe("error handling", () => {
    it("returns 500 when the database throws", async () => {
      jest.mocked(prisma.conversation.findUnique).mockRejectedValue(new Error("DB error"));
      const res = await GET(makeRequest(), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});