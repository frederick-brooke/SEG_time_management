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
    conversationParticipant: {
      findFirst: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
    },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/src/lib/prisma";

const makeParams = (conversationId: string) => Promise.resolve({ conversationId });
const makeRequest = (url = "http://localhost/api/conversations/conv-1/messages") =>
  new Request(url) as any;

const mockParticipant = {
  id: "participant-1",
  conversationId: "conv-1",
  userId: "user-1",
  role: "member",
  joinedAt: new Date("2024-01-01"),
  deletedAt: null,
  lastReadAt: null,
};

const mockMessages = [
  {
    id: "msg-2",
    content: "Hello again",
    createdAt: new Date("2024-01-02T10:01:00Z"),
    conversationId: "conv-1",
    senderId: "user-2",
    sender: { id: "user-2", username: "bob", pfp: null },
  },
  {
    id: "msg-1",
    content: "Hello",
    createdAt: new Date("2024-01-02T10:00:00Z"),
    conversationId: "conv-1",
    senderId: "user-1",
    sender: { id: "user-1", username: "alice", pfp: null },
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getServerSession).mockResolvedValue({ user: { id: "user-1" } });
  jest.mocked(prisma.conversationParticipant.findFirst).mockResolvedValue(mockParticipant);
  jest.mocked(prisma.message.findMany).mockResolvedValue(mockMessages);
});

describe("GET /api/conversations/[conversationId]/messages", () => {
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

  describe("success", () => {
    it("returns messages for the conversation", async () => {
      const res = await GET(makeRequest(), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toHaveLength(2);
    });

    it("queries with the correct conversationId", async () => {
      await GET(makeRequest(), { params: makeParams("conv-1") });
      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ conversationId: "conv-1" }),
        })
      );
    });

    it("returns messages ordered by createdAt descending", async () => {
      await GET(makeRequest(), { params: makeParams("conv-1") });
      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: "desc" } })
      );
    });

    it("limits results to 20 messages", async () => {
      await GET(makeRequest(), { params: makeParams("conv-1") });
      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20 })
      );
    });

    it("includes sender fields on each message", async () => {
      const res = await GET(makeRequest(), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(data[0].sender).toHaveProperty("id");
      expect(data[0].sender).toHaveProperty("username");
      expect(data[0].sender).toHaveProperty("pfp");
    });
  });

  describe("pagination", () => {
    it("passes cursor and skip when cursor param is provided", async () => {
      await GET(
        makeRequest("http://localhost/api/conversations/conv-1/messages?cursor=msg-1"),
        { params: makeParams("conv-1") }
      );
      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: "msg-1" },
          skip: 1,
        })
      );
    });

    it("does not pass cursor when no cursor param is provided", async () => {
      await GET(makeRequest(), { params: makeParams("conv-1") });
      const callArg = jest.mocked(prisma.message.findMany).mock.calls[0][0];
      expect(callArg).not.toHaveProperty("cursor");
      expect(callArg).not.toHaveProperty("skip");
    });
  });

  describe("history clearing", () => {
    it("filters messages by deletedAt when user has cleared history", async () => {
      const deletedAt = new Date("2024-01-01T12:00:00Z");
      jest.mocked(prisma.conversationParticipant.findFirst).mockResolvedValue({
        ...mockParticipant,
        deletedAt,
      });
      await GET(makeRequest(), { params: makeParams("conv-1") });
      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gt: deletedAt },
          }),
        })
      );
    });

    it("does not filter by createdAt when user has not cleared history", async () => {
      jest.mocked(prisma.conversationParticipant.findFirst).mockResolvedValue({
        ...mockParticipant,
        deletedAt: null,
      });
      await GET(makeRequest(), { params: makeParams("conv-1") });
      const callArg = jest.mocked(prisma.message.findMany).mock.calls[0][0] as any;
      expect(callArg.where).not.toHaveProperty("createdAt");
    });
  });
});