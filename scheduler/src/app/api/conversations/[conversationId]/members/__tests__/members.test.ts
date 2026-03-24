import { POST, PATCH, DELETE } from "../route";

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
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));
jest.mock("pusher", () =>
  jest.fn().mockImplementation(() => ({
    trigger: jest.fn().mockResolvedValue({}),
  }))
);

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const makeParams = (conversationId: string) => Promise.resolve({ conversationId });
const makeRequest = (body?: object) =>
  new Request("http://localhost/api/conversations/conv-1/members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }) as any;

const adminParticipant = {
  id: "participant-1",
  conversationId: "conv-1",
  userId: "user-1",
  role: "admin",
  joinedAt: new Date("2024-01-01"),
  deletedAt: null,
  lastReadAt: null,
};

const memberParticipant = {
  id: "participant-2",
  conversationId: "conv-1",
  userId: "user-2",
  role: "member",
  joinedAt: new Date("2024-01-02"),
  deletedAt: null,
  lastReadAt: null,
};

const createdMember = {
  id: "participant-3",
  conversationId: "conv-1",
  userId: "user-3",
  role: "member",
  joinedAt: new Date(),
  deletedAt: null,
  lastReadAt: null,
  user: { id: "user-3", username: "charlie", fname: "Charlie", lname: null, pfp: null },
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getServerSession).mockResolvedValue({ user: { id: "user-1" } });
});

describe("POST /api/conversations/[conversationId]/members", () => {
  describe("authentication", () => {
    it("returns 401 when there is no session", async () => {
      jest.mocked(getServerSession).mockResolvedValue(null);
      const res = await POST(makeRequest({ userId: "user-3" }), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("authorisation", () => {
    it("returns 403 when requester is not an admin", async () => {
      jest.mocked(prisma.conversationParticipant.findUnique).mockResolvedValue(memberParticipant);
      const res = await POST(makeRequest({ userId: "user-3" }), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(403);
      expect(data.error).toBe("Only admins can add members");
    });
  });
  
  describe("success", () => {
    it("adds a member and returns the created participant", async () => {
      jest.mocked(prisma.conversationParticipant.findUnique).mockResolvedValue(adminParticipant);
      jest.mocked(prisma.conversationParticipant.create).mockResolvedValue(createdMember);
      const res = await POST(makeRequest({ userId: "user-3" }), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.userId).toBe("user-3");
      expect(data.role).toBe("member");
    });

    it("creates participant with the correct data", async () => {
      jest.mocked(prisma.conversationParticipant.findUnique).mockResolvedValue(adminParticipant);
      jest.mocked(prisma.conversationParticipant.create).mockResolvedValue(createdMember);
      await POST(makeRequest({ userId: "user-3" }), { params: makeParams("conv-1") });
      expect(prisma.conversationParticipant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ conversationId: "conv-1", userId: "user-3", role: "member" }),
        })
      );
    });
  });
});

describe("PATCH /api/conversations/[conversationId]/members", () => {
  describe("authentication", () => {
    it("returns 401 when there is no session", async () => {
      jest.mocked(getServerSession).mockResolvedValue(null);
      const res = await PATCH(makeRequest({ userId: "user-2", role: "admin" }), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("authorisation", () => {
    it("returns 403 when requester is not an admin", async () => {
      jest.mocked(prisma.conversationParticipant.findUnique).mockResolvedValue(memberParticipant);
      const res = await PATCH(makeRequest({ userId: "user-2", role: "admin" }), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(403);
      expect(data.error).toBe("Only admins can change roles");
    });
  });

  describe("success", () => {
    it("updates the role and returns the updated participant", async () => {
      const updated = { ...memberParticipant, role: "admin", user: { id: "user-2", username: "bob", pfp: null } };
      jest.mocked(prisma.conversationParticipant.findUnique).mockResolvedValue(adminParticipant);
      jest.mocked(prisma.conversationParticipant.update).mockResolvedValue(updated);
      const res = await PATCH(makeRequest({ userId: "user-2", role: "admin" }), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.role).toBe("admin");
    });

    it("updates with the correct conversationId and userId", async () => {
      const updated = { ...memberParticipant, role: "admin", user: { id: "user-2", username: "bob", pfp: null } };
      jest.mocked(prisma.conversationParticipant.findUnique).mockResolvedValue(adminParticipant);
      jest.mocked(prisma.conversationParticipant.update).mockResolvedValue(updated);
      await PATCH(makeRequest({ userId: "user-2", role: "admin" }), { params: makeParams("conv-1") });
      expect(prisma.conversationParticipant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { conversationId_userId: { conversationId: "conv-1", userId: "user-2" } },
          data: { role: "admin" },
        })
      );
    });
  });
});

describe("DELETE /api/conversations/[conversationId]/members", () => {
  describe("authentication", () => {
    it("returns 401 when there is no session", async () => {
      jest.mocked(getServerSession).mockResolvedValue(null);
      const res = await DELETE(makeRequest({}), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("authorisation", () => {
    it("returns 403 when a non-admin tries to remove another user", async () => {
      jest.mocked(getServerSession).mockResolvedValue({ user: { id: "user-2" } });
      jest.mocked(prisma.conversationParticipant.findUnique).mockResolvedValue(memberParticipant);
      const res = await DELETE(makeRequest({ userId: "user-3" }), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(403);
      expect(data.error).toBe("Only admins can remove members");
    });
  });

  describe("success", () => {
    it("allows a member to leave by omitting userId", async () => {
      jest.mocked(prisma.conversationParticipant.findUnique).mockResolvedValue(memberParticipant);
      jest.mocked(prisma.conversationParticipant.delete).mockResolvedValue(memberParticipant);
      jest.mocked(prisma.conversationParticipant.findMany).mockResolvedValue([]);
      const res = await DELETE(makeRequest({}), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("allows an admin to remove another user", async () => {
      jest.mocked(prisma.conversationParticipant.findUnique)
        .mockResolvedValueOnce(adminParticipant)
        .mockResolvedValueOnce(memberParticipant);
      jest.mocked(prisma.conversationParticipant.delete).mockResolvedValue(memberParticipant);
      jest.mocked(prisma.conversationParticipant.findMany).mockResolvedValue([]);
      const res = await DELETE(makeRequest({ userId: "user-2" }), { params: makeParams("conv-1") });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("promotes the next oldest member when the admin leaves", async () => {
      jest.mocked(prisma.conversationParticipant.findUnique).mockResolvedValue(adminParticipant);
      jest.mocked(prisma.conversationParticipant.findFirst).mockResolvedValue(memberParticipant);
      jest.mocked(prisma.conversationParticipant.update).mockResolvedValue({ ...memberParticipant, role: "admin" });
      jest.mocked(prisma.conversationParticipant.delete).mockResolvedValue(adminParticipant);
      jest.mocked(prisma.conversationParticipant.findMany).mockResolvedValue([]);
      await DELETE(makeRequest({}), { params: makeParams("conv-1") });
      expect(prisma.conversationParticipant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { role: "admin" },
        })
      );
    });

    it("does not promote anyone when a regular member leaves", async () => {
      jest.mocked(prisma.conversationParticipant.findUnique).mockResolvedValue(memberParticipant);
      jest.mocked(prisma.conversationParticipant.delete).mockResolvedValue(memberParticipant);
      jest.mocked(prisma.conversationParticipant.findMany).mockResolvedValue([]);
      await DELETE(makeRequest({}), { params: makeParams("conv-1") });
      expect(prisma.conversationParticipant.update).not.toHaveBeenCalled();
    });

    it("deletes the correct participant", async () => {
      jest.mocked(prisma.conversationParticipant.findUnique).mockResolvedValue(memberParticipant);
      jest.mocked(prisma.conversationParticipant.delete).mockResolvedValue(memberParticipant);
      jest.mocked(prisma.conversationParticipant.findMany).mockResolvedValue([]);
      await DELETE(makeRequest({}), { params: makeParams("conv-1") });
      expect(prisma.conversationParticipant.delete).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { conversationId_userId: { conversationId: "conv-1", userId: "user-1" } },
        })
      );
    });
  });
});