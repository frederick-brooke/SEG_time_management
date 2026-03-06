import { POST, DELETE } from "../route";
import { getServerSession } from "next-auth";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("lib/auth", () => ({ authOptions: {} }));

jest.mock("lib/prisma", () => ({
  prisma: {
    message: { create: jest.fn() },
    conversation: { update: jest.fn() },
    conversationParticipant: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock("pusher", () =>
  jest.fn().mockImplementation(() => ({
    trigger: jest.fn().mockResolvedValue({}),
  }))
);

import { prisma } from "lib/prisma";

const mockSession = { user: { id: "user-1" } };

const makePostRequest = (conversationId, body) =>
  new Request(`http://localhost/api/conversations/${conversationId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const makeDeleteRequest = (conversationId) =>
  new Request(`http://localhost/api/conversations/${conversationId}`, {
    method: "DELETE",
  });

const makeParams = (conversationId) => Promise.resolve({ conversationId });

beforeEach(() => jest.clearAllMocks());

describe("POST /api/conversations/[conversationId] (send message)", () => {
  it("returns 401 if unauthenticated", async () => {
    getServerSession.mockResolvedValue(null);
    const res = await POST(makePostRequest("conv-1", { content: "hi" }), { params: makeParams("conv-1") });
    expect(res.status).toBe(401);
  });

  it("returns 400 if content is missing", async () => {
    getServerSession.mockResolvedValue(mockSession);
    const res = await POST(makePostRequest("conv-1", {}), { params: makeParams("conv-1") });
    expect(res.status).toBe(400);
  });

  it("returns 400 if body is invalid JSON", async () => {
    getServerSession.mockResolvedValue(mockSession);
    const req = new Request("http://localhost/api/conversations/conv-1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req, { params: makeParams("conv-1") });
    expect(res.status).toBe(400);
  });

  it("creates a message and updates lastMessage on the conversation", async () => {
    getServerSession.mockResolvedValue(mockSession);
    const mockMessage = {
      id: "msg-1",
      content: "hello",
      conversationId: "conv-1",
      senderId: "user-1",
      createdAt: new Date(),
      sender: { id: "user-1", username: "alice", pfp: null },
    };
    prisma.message.create.mockResolvedValue(mockMessage);
    prisma.conversation.update.mockResolvedValue({});

    const res = await POST(makePostRequest("conv-1", { content: "hello" }), { params: makeParams("conv-1") });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.content).toBe("hello");
    expect(prisma.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ content: "hello", conversationId: "conv-1", senderId: "user-1" }),
      })
    );
    expect(prisma.conversation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "conv-1" },
        data: expect.objectContaining({ lastMessage: "hello" }),
      })
    );
  });

  it("returns 500 if prisma throws", async () => {
    getServerSession.mockResolvedValue(mockSession);
    prisma.message.create.mockRejectedValue(new Error("DB error"));

    const res = await POST(makePostRequest("conv-1", { content: "hello" }), { params: makeParams("conv-1") });
    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/conversations/[conversationId] (clear history for self)", () => {
  it("returns 401 if unauthenticated", async () => {
    getServerSession.mockResolvedValue(null);
    const res = await DELETE(makeDeleteRequest("conv-1"), { params: makeParams("conv-1") });
    expect(res.status).toBe(401);
  });

  it("returns 404 if user is not a participant", async () => {
    getServerSession.mockResolvedValue(mockSession);
    prisma.conversationParticipant.findFirst.mockResolvedValue(null);

    const res = await DELETE(makeDeleteRequest("conv-1"), { params: makeParams("conv-1") });
    expect(res.status).toBe(404);
  });

  it("stamps deletedAt on the requesting user's participant record only", async () => {
    getServerSession.mockResolvedValue(mockSession);
    prisma.conversationParticipant.findFirst.mockResolvedValue({
      id: "part-1",
      conversationId: "conv-1",
      userId: "user-1",
      deletedAt: null,
    });
    prisma.conversationParticipant.updateMany.mockResolvedValue({ count: 1 });

    const res = await DELETE(makeDeleteRequest("conv-1"), { params: makeParams("conv-1") });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.conversationParticipant.updateMany).toHaveBeenCalledWith({
      where: { conversationId: "conv-1", userId: "user-1" },
      data: expect.objectContaining({ deletedAt: expect.any(Date) }),
    });
  });

  it("does not affect other participants when clearing history", async () => {
    getServerSession.mockResolvedValue(mockSession);
    prisma.conversationParticipant.findFirst.mockResolvedValue({ id: "part-1" });
    prisma.conversationParticipant.updateMany.mockResolvedValue({ count: 1 });

    await DELETE(makeDeleteRequest("conv-1"), { params: makeParams("conv-1") });

    const callArgs = prisma.conversationParticipant.updateMany.mock.calls[0][0];
    expect(callArgs.where.userId).toBe("user-1");
    expect(callArgs.where.conversationId).toBe("conv-1");
  });

  it("returns 500 if prisma throws", async () => {
    getServerSession.mockResolvedValue(mockSession);
    prisma.conversationParticipant.findFirst.mockResolvedValue({ id: "part-1" });
    prisma.conversationParticipant.updateMany.mockRejectedValue(new Error("DB error"));

    const res = await DELETE(makeDeleteRequest("conv-1"), { params: makeParams("conv-1") });
    expect(res.status).toBe(500);
  });
});