import { GET } from "../route";
import { getServerSession } from "next-auth";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("lib/auth", () => ({ authOptions: {} }));

jest.mock("lib/prisma", () => ({
  prisma: {
    conversationParticipant: { findFirst: jest.fn() },
    message: { findMany: jest.fn() },
  },
}));

import { prisma } from "lib/prisma";

const mockSession = { user: { id: "user-1" } };

const makeRequest = (conversationId, cursor) => {
  const url = `http://localhost/api/conversations/${conversationId}/messages${cursor ? `?cursor=${cursor}` : ""}`;
  return new Request(url);
};

const makeParams = (conversationId) => Promise.resolve({ conversationId });

const makeMessage = (id, createdAt) => ({
  id,
  content: `Message ${id}`,
  conversationId: "conv-1",
  senderId: "user-2",
  createdAt,
  sender: { id: "user-2", username: "bob", pfp: null },
});

beforeEach(() => jest.clearAllMocks());

describe("GET /api/conversations/[conversationId]/messages", () => {
  it("returns 401 if unauthenticated", async () => {
    getServerSession.mockResolvedValue(null);
    const res = await GET(makeRequest("conv-1"), { params: makeParams("conv-1") });
    expect(res.status).toBe(401);
  });

  it("returns all messages when user has no deletedAt", async () => {
    getServerSession.mockResolvedValue(mockSession);
    prisma.conversationParticipant.findFirst.mockResolvedValue({
      userId: "user-1",
      conversationId: "conv-1",
      deletedAt: null,
    });
    prisma.message.findMany.mockResolvedValue([makeMessage("msg-1", new Date("2024-01-01"))]);

    const res = await GET(makeRequest("conv-1"), { params: makeParams("conv-1") });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);

    const callArgs = prisma.message.findMany.mock.calls[0][0];
    expect(callArgs.where.createdAt).toBeUndefined();
  });

  it("adds createdAt gt filter when user has cleared history", async () => {
    getServerSession.mockResolvedValue(mockSession);
    const deletedAt = new Date("2024-06-01");
    prisma.conversationParticipant.findFirst.mockResolvedValue({
      userId: "user-1",
      conversationId: "conv-1",
      deletedAt,
    });
    prisma.message.findMany.mockResolvedValue([]);

    await GET(makeRequest("conv-1"), { params: makeParams("conv-1") });

    const callArgs = prisma.message.findMany.mock.calls[0][0];
    expect(callArgs.where.createdAt).toEqual({ gt: deletedAt });
  });

  it("only returns messages sent after deletedAt", async () => {
    getServerSession.mockResolvedValue(mockSession);
    const deletedAt = new Date("2024-06-01");
    prisma.conversationParticipant.findFirst.mockResolvedValue({ userId: "user-1", deletedAt });
    const newMessage = makeMessage("msg-new", new Date("2024-06-02"));
    prisma.message.findMany.mockResolvedValue([newMessage]);

    const res = await GET(makeRequest("conv-1"), { params: makeParams("conv-1") });
    const data = await res.json();

    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("msg-new");
  });

  it("uses cursor for pagination when provided", async () => {
    getServerSession.mockResolvedValue(mockSession);
    prisma.conversationParticipant.findFirst.mockResolvedValue({ userId: "user-1", deletedAt: null });
    prisma.message.findMany.mockResolvedValue([]);

    await GET(makeRequest("conv-1", "msg-5"), { params: makeParams("conv-1") });

    const callArgs = prisma.message.findMany.mock.calls[0][0];
    expect(callArgs.cursor).toEqual({ id: "msg-5" });
    expect(callArgs.skip).toBe(1);
  });

  it("fetches 20 messages ordered newest first", async () => {
    getServerSession.mockResolvedValue(mockSession);
    prisma.conversationParticipant.findFirst.mockResolvedValue({ userId: "user-1", deletedAt: null });
    prisma.message.findMany.mockResolvedValue([]);

    await GET(makeRequest("conv-1"), { params: makeParams("conv-1") });

    const callArgs = prisma.message.findMany.mock.calls[0][0];
    expect(callArgs.take).toBe(20);
    expect(callArgs.orderBy).toEqual({ createdAt: "desc" });
  });

  it("returns empty array when all messages predate the clear", async () => {
    getServerSession.mockResolvedValue(mockSession);
    prisma.conversationParticipant.findFirst.mockResolvedValue({
      userId: "user-1",
      deletedAt: new Date("2024-12-31"),
    });
    prisma.message.findMany.mockResolvedValue([]);

    const res = await GET(makeRequest("conv-1"), { params: makeParams("conv-1") });
    const data = await res.json();

    expect(data).toEqual([]);
  });
});