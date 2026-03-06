import { POST, PATCH, DELETE } from "../route";
import { getServerSession } from "next-auth";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("lib/auth", () => ({ authOptions: {} }));

jest.mock("lib/prisma", () => ({
  prisma: {
    conversationParticipant: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from "lib/prisma";

const mockSession = { user: { id: "user-1" } };
const makeParams = (conversationId) => Promise.resolve({ conversationId });

const makeRequest = (method, body) =>
  new Request("http://localhost/api/conversations/conv-1/members", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => jest.clearAllMocks());

// POST (add member)

describe("POST /members (add member)", () => {
  it("returns 401 if unauthenticated", async () => {
    getServerSession.mockResolvedValue(null);
    const res = await POST(makeRequest("POST", { userId: "user-3" }), { params: makeParams("conv-1") });
    expect(res.status).toBe(401);
  });

  it("returns 403 if requester is not an admin", async () => {
    getServerSession.mockResolvedValue(mockSession);
    prisma.conversationParticipant.findUnique.mockResolvedValue({ role: "member" });

    const res = await POST(makeRequest("POST", { userId: "user-3" }), { params: makeParams("conv-1") });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe("Only admins can add members");
  });

  it("returns 403 if requester is not a participant at all", async () => {
    getServerSession.mockResolvedValue(mockSession);
    prisma.conversationParticipant.findUnique.mockResolvedValue(null);

    const res = await POST(makeRequest("POST", { userId: "user-3" }), { params: makeParams("conv-1") });
    expect(res.status).toBe(403);
  });

  it("adds member and returns the new participant when requester is admin", async () => {
    getServerSession.mockResolvedValue(mockSession);
    prisma.conversationParticipant.findUnique.mockResolvedValue({ role: "admin" });
    const newMember = {
      conversationId: "conv-1",
      userId: "user-3",
      role: "member",
      user: { id: "user-3", username: "charlie", fname: "Charlie", lname: null, pfp: null },
    };
    prisma.conversationParticipant.create.mockResolvedValue(newMember);

    const res = await POST(makeRequest("POST", { userId: "user-3" }), { params: makeParams("conv-1") });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.userId).toBe("user-3");
    expect(data.role).toBe("member");
    expect(prisma.conversationParticipant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { conversationId: "conv-1", userId: "user-3", role: "member" },
      })
    );
  });
});

// PATCH (promote/demote member)

describe("PATCH /members (change role)", () => {
  it("returns 401 if unauthenticated", async () => {
    getServerSession.mockResolvedValue(null);
    const res = await PATCH(makeRequest("PATCH", { userId: "user-2", role: "admin" }), { params: makeParams("conv-1") });
    expect(res.status).toBe(401);
  });

  it("returns 403 if requester is not an admin", async () => {
    getServerSession.mockResolvedValue(mockSession);
    prisma.conversationParticipant.findUnique.mockResolvedValue({ role: "member" });

    const res = await PATCH(makeRequest("PATCH", { userId: "user-2", role: "admin" }), { params: makeParams("conv-1") });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe("Only admins can change roles");
  });

  it("promotes a member to admin when requester is admin", async () => {
    getServerSession.mockResolvedValue(mockSession);
    prisma.conversationParticipant.findUnique.mockResolvedValue({ role: "admin" });
    const updated = {
      conversationId: "conv-1",
      userId: "user-2",
      role: "admin",
      user: { id: "user-2", username: "bob", pfp: null },
    };
    prisma.conversationParticipant.update.mockResolvedValue(updated);

    const res = await PATCH(makeRequest("PATCH", { userId: "user-2", role: "admin" }), { params: makeParams("conv-1") });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.role).toBe("admin");
    expect(prisma.conversationParticipant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { conversationId_userId: { conversationId: "conv-1", userId: "user-2" } },
        data: { role: "admin" },
      })
    );
  });

  it("demotes an admin to member", async () => {
    getServerSession.mockResolvedValue(mockSession);
    prisma.conversationParticipant.findUnique.mockResolvedValue({ role: "admin" });
    prisma.conversationParticipant.update.mockResolvedValue({ role: "member" });

    const res = await PATCH(makeRequest("PATCH", { userId: "user-2", role: "member" }), { params: makeParams("conv-1") });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.role).toBe("member");
  });
});

// DELETE (remove member or leave)

describe("DELETE /members (remove or leave)", () => {
  it("returns 401 if unauthenticated", async () => {
    getServerSession.mockResolvedValue(null);
    const res = await DELETE(makeRequest("DELETE", { userId: "user-2" }), { params: makeParams("conv-1") });
    expect(res.status).toBe(401);
  });

  it("returns 403 if non-admin tries to remove someone else", async () => {
    getServerSession.mockResolvedValue(mockSession);
    prisma.conversationParticipant.findUnique.mockResolvedValue({ role: "member" });

    const res = await DELETE(makeRequest("DELETE", { userId: "user-2" }), { params: makeParams("conv-1") });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe("Only admins can remove members");
  });

  it("allows admin to remove another member", async () => {
    getServerSession.mockResolvedValue(mockSession);
    prisma.conversationParticipant.findUnique
      .mockResolvedValueOnce({ role: "admin" })
      .mockResolvedValueOnce({ role: "member" });
    prisma.conversationParticipant.delete.mockResolvedValue({});

    const res = await DELETE(makeRequest("DELETE", { userId: "user-2" }), { params: makeParams("conv-1") });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.conversationParticipant.delete).toHaveBeenCalledWith({
      where: { conversationId_userId: { conversationId: "conv-1", userId: "user-2" } },
    });
  });

  it("allows a member to leave the group themselves (no body)", async () => {
    getServerSession.mockResolvedValue(mockSession);
    prisma.conversationParticipant.findUnique.mockResolvedValue({ role: "member" });
    prisma.conversationParticipant.delete.mockResolvedValue({});

    const req = new Request("http://localhost/api/conversations/conv-1/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await DELETE(req, { params: makeParams("conv-1") });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.conversationParticipant.delete).toHaveBeenCalledWith({
      where: { conversationId_userId: { conversationId: "conv-1", userId: "user-1" } },
    });
  });

  it("transfers admin role to earliest member when admin leaves", async () => {
    getServerSession.mockResolvedValue(mockSession);
    prisma.conversationParticipant.findUnique.mockResolvedValue({ role: "admin" });
    prisma.conversationParticipant.findFirst.mockResolvedValue({
      userId: "user-2",
      conversationId: "conv-1",
    });
    prisma.conversationParticipant.update.mockResolvedValue({});
    prisma.conversationParticipant.delete.mockResolvedValue({});

    const req = new Request("http://localhost/api/conversations/conv-1/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await DELETE(req, { params: makeParams("conv-1") });

    expect(prisma.conversationParticipant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { conversationId_userId: { conversationId: "conv-1", userId: "user-2" } },
        data: { role: "admin" },
      })
    );
    expect(prisma.conversationParticipant.delete).toHaveBeenCalled();
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("does not transfer admin if no other members exist", async () => {
    getServerSession.mockResolvedValue(mockSession);
    prisma.conversationParticipant.findUnique.mockResolvedValue({ role: "admin" });
    prisma.conversationParticipant.findFirst.mockResolvedValue(null);
    prisma.conversationParticipant.delete.mockResolvedValue({});

    const req = new Request("http://localhost/api/conversations/conv-1/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    await DELETE(req, { params: makeParams("conv-1") });

    expect(prisma.conversationParticipant.update).not.toHaveBeenCalled();
    expect(prisma.conversationParticipant.delete).toHaveBeenCalled();
  });
});