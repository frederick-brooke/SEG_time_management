/**
 * Testing for conversations/new api route
 */

import { POST } from "../route";

// Mocks

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

jest.mock("@/lib/auth", () => ({ authOptions: {} }));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    conversation: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

const makeRequest = (body: object) =>
  new Request("http://localhost/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as any;

const mockConversation = {
  id: "conv-1",
  isGroup: false,
  name: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  lastMessage: null,
  lastMessageAt: null,
  createdById: "user-1",
  participants: [
    {
      id: "participant-1",
      conversationId: "conv-1",
      userId: "user-1",
      role: "member",
      joinedAt: new Date("2024-01-01"),
      deletedAt: null,
      lastReadAt: null,
      user: { id: "user-1", username: "alice", fname: "Alice", lname: null, pfp: null },
    },
    {
      id: "participant-2",
      conversationId: "conv-1",
      userId: "user-2",
      role: "member",
      joinedAt: new Date("2024-01-01"),
      deletedAt: null,
      lastReadAt: null,
      user: { id: "user-2", username: "bob", fname: "Bob", lname: null, pfp: null },
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getServerSession).mockResolvedValue({ user: { id: "user-1" } });
  jest.mocked(prisma.conversation.findMany).mockResolvedValue([]);
  jest.mocked(prisma.conversation.create).mockResolvedValue(mockConversation);
});

// Tests

describe("POST /api/conversations", () => {
  describe("authentication", () => {
    it("returns 401 when there is no session", async () => {
      jest.mocked(getServerSession).mockResolvedValue(null);
      const res = await POST(makeRequest({ targetUserId: "user-2" }));
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("existing conversation", () => {
    it("returns the existing conversation if one already exists", async () => {
      jest.mocked(prisma.conversation.findMany).mockResolvedValue([mockConversation]);
      const res = await POST(makeRequest({ targetUserId: "user-2" }));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.id).toBe("conv-1");
      expect(prisma.conversation.create).not.toHaveBeenCalled();
    });

    it("does not match if there are more than 2 participants", async () => {
      const groupConvo = {
        ...mockConversation,
        participants: [
          ...mockConversation.participants,
          {
            id: "participant-3",
            conversationId: "conv-1",
            userId: "user-3",
            role: "member",
            joinedAt: new Date("2024-01-01"),
            deletedAt: null,
            lastReadAt: null,
          },
        ],
      };
      jest.mocked(prisma.conversation.findMany).mockResolvedValue([groupConvo] as any);
      await POST(makeRequest({ targetUserId: "user-2" }));
      expect(prisma.conversation.create).toHaveBeenCalled();
    });

    it("does not match if the target user is not a participant", async () => {
      const otherConvo = {
        ...mockConversation,
        participants: [
          mockConversation.participants[0],
          { ...mockConversation.participants[1], userId: "user-99" },
        ],
      };
      jest.mocked(prisma.conversation.findMany).mockResolvedValue([otherConvo] as any);
      await POST(makeRequest({ targetUserId: "user-2" }));
      expect(prisma.conversation.create).toHaveBeenCalled();
    });
  });

  describe("new conversation", () => {
    it("creates and returns a new conversation", async () => {
      const res = await POST(makeRequest({ targetUserId: "user-2" }));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.id).toBe("conv-1");
      expect(prisma.conversation.create).toHaveBeenCalled();
    });

    it("creates with isGroup: false", async () => {
      await POST(makeRequest({ targetUserId: "user-2" }));
      expect(prisma.conversation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isGroup: false }),
        })
      );
    });

    it("creates with both users as participants", async () => {
      await POST(makeRequest({ targetUserId: "user-2" }));
      expect(prisma.conversation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            participants: {
              create: expect.arrayContaining([
                { userId: "user-1" },
                { userId: "user-2" },
              ]),
            },
          }),
        })
      );
    });

    it("includes participant user details in the response", async () => {
      const res = await POST(makeRequest({ targetUserId: "user-2" }));
      const data = await res.json();
      expect(data.participants[0].user).toHaveProperty("username");
      expect(data.participants[0].user).toHaveProperty("fname");
      expect(data.participants[0].user).toHaveProperty("pfp");
    });
  });

  describe("error handling", () => {
    it("returns 500 when the database throws on create", async () => {
      jest.mocked(prisma.conversation.create).mockRejectedValue(new Error("DB error"));
      const res = await POST(makeRequest({ targetUserId: "user-2" }));
      const data = await res.json();
      expect(res.status).toBe(500);
    });
  });
});