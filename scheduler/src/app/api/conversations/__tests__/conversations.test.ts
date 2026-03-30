/**
 * Testing for api/conversations route.
 */

import { GET, POST } from "../route";

// Mocks

jest.mock("next/server", () => ({
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
    conversationParticipant: {
      updateMany: jest.fn(),
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

const makeParticipant = (userId: string, overrides = {}) => ({
  id: `participant-${userId}`,
  conversationId: "conv-1",
  userId,
  role: "member",
  joinedAt: new Date("2024-01-01"),
  deletedAt: null,
  lastReadAt: null,
  user: { id: userId, username: userId, fname: null, lname: null, pfp: null },
  ...overrides,
});

const mockDmConversation = {
  id: "conv-1",
  isGroup: false,
  name: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  lastMessage: "Hello",
  lastMessageAt: new Date("2024-01-02"),
  createdById: "user-1",
  participants: [makeParticipant("user-1"), makeParticipant("user-2")],
  messages: [{ senderId: "user-2", createdAt: new Date("2024-01-02") }],
};

const mockGroupConversation = {
  id: "conv-2",
  isGroup: true,
  name: "Study Group",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  lastMessage: null,
  lastMessageAt: null,
  createdById: "user-1",
  participants: [
    makeParticipant("user-1", { role: "admin" }),
    makeParticipant("user-2"),
    makeParticipant("user-3"),
  ],
  messages: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getServerSession).mockResolvedValue({ user: { id: "user-1" } });
  jest.mocked(prisma.conversation.findMany).mockResolvedValue([]);
  jest.mocked(prisma.conversation.create).mockResolvedValue(mockDmConversation);
  jest.mocked(prisma.conversationParticipant.updateMany).mockResolvedValue({ count: 1 });
});

// Tests

describe("GET /api/conversations", () => {
  describe("authentication", () => {
    it("returns 401 when there is no session", async () => {
      jest.mocked(getServerSession).mockResolvedValue(null);
      const res = await GET();
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("success", () => {
    it("returns an empty array when there are no conversations", async () => {
      const res = await GET();
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toEqual([]);
    });

    it("returns conversations for the current user", async () => {
      jest.mocked(prisma.conversation.findMany).mockResolvedValue([mockDmConversation] as any);
      const res = await GET();
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe("conv-1");
    });

    it("annotates hasUnread: true when there is an unread message", async () => {
      const conv = {
        ...mockDmConversation,
        participants: [
          makeParticipant("user-1", { lastReadAt: new Date("2024-01-01") }),
          makeParticipant("user-2"),
        ],
        messages: [{ senderId: "user-2", createdAt: new Date("2024-01-02") }],
      };
      jest.mocked(prisma.conversation.findMany).mockResolvedValue([conv] as any);
      const res = await GET();
      const data = await res.json();
      expect(data[0].hasUnread).toBe(true);
    });

    it("annotates hasUnread: true when lastReadAt is null and there is a message from someone else", async () => {
      const conv = {
        ...mockDmConversation,
        participants: [
          makeParticipant("user-1", { lastReadAt: null }),
          makeParticipant("user-2"),
        ],
        messages: [{ senderId: "user-2", createdAt: new Date("2024-01-02") }],
      };
      jest.mocked(prisma.conversation.findMany).mockResolvedValue([conv] as any);
      const res = await GET();
      const data = await res.json();
      expect(data[0].hasUnread).toBe(true);
    });

    it("annotates hasUnread: false when the last message was sent by me", async () => {
      const conv = {
        ...mockDmConversation,
        messages: [{ senderId: "user-1", createdAt: new Date("2024-01-02") }],
      };
      jest.mocked(prisma.conversation.findMany).mockResolvedValue([conv] as any);
      const res = await GET();
      const data = await res.json();
      expect(data[0].hasUnread).toBe(false);
    });

    it("annotates lastMessageSentByMe correctly", async () => {
      const conv = {
        ...mockDmConversation,
        messages: [{ senderId: "user-1", createdAt: new Date("2024-01-02") }],
      };
      jest.mocked(prisma.conversation.findMany).mockResolvedValue([conv] as any);
      const res = await GET();
      const data = await res.json();
      expect(data[0].lastMessageSentByMe).toBe(true);
    });

    it("strips raw messages from the response", async () => {
      jest.mocked(prisma.conversation.findMany).mockResolvedValue([mockDmConversation] as any);
      const res = await GET();
      const data = await res.json();
      expect(data[0].messages).toBeUndefined();
    });
  });

  describe("history clearing", () => {
    it("hides a conversation the user has cleared", async () => {
      const conv = {
        ...mockDmConversation,
        lastMessageAt: new Date("2024-01-01"),
        participants: [
          makeParticipant("user-1", { deletedAt: new Date("2024-01-02") }),
          makeParticipant("user-2"),
        ],
      };
      jest.mocked(prisma.conversation.findMany).mockResolvedValue([conv] as any);
      const res = await GET();
      const data = await res.json();
      expect(data).toHaveLength(0);
    });

    it("shows a cleared conversation if a new message arrived after clearing", async () => {
      const conv = {
        ...mockDmConversation,
        lastMessageAt: new Date("2024-01-03"),
        participants: [
          makeParticipant("user-1", { deletedAt: new Date("2024-01-02") }),
          makeParticipant("user-2"),
        ],
      };
      jest.mocked(prisma.conversation.findMany).mockResolvedValue([conv] as any);
      const res = await GET();
      const data = await res.json();
      expect(data).toHaveLength(1);
    });
  });
});

describe("POST /api/conversations", () => {
  describe("authentication", () => {
    it("returns 401 when there is no session", async () => {
      jest.mocked(getServerSession).mockResolvedValue(null);
      const res = await POST(makeRequest({ memberIds: ["user-2"], isGroup: false }));
      const data = await res.json();
      expect(res.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("validation (parseRequestBody)", () => {
    it("returns 400 when body is invalid JSON", async () => {
      const req = new Request("http://localhost/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      }) as any;
      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid body");
    });

    it("returns 400 when body is missing", async () => {
      const req = new Request("http://localhost/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }) as any;
      const res = await POST(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid body");
    });
  });

  describe("1-to-1 conversation (find1to1Conversation + handle1to1Duplicate)", () => {
    it("returns existing conversation if one already exists", async () => {
      jest.mocked(prisma.conversation.findMany).mockResolvedValue([mockDmConversation] as any);
      const res = await POST(makeRequest({ memberIds: ["user-2"], isGroup: false }));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.id).toBe("conv-1");
      expect(prisma.conversation.create).not.toHaveBeenCalled();
    });

    it("resets deletedAt when returning an existing cleared conversation", async () => {
      jest.mocked(prisma.conversation.findMany).mockResolvedValue([mockDmConversation] as any);
      await POST(makeRequest({ memberIds: ["user-2"], isGroup: false }));
      expect(prisma.conversationParticipant.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ conversationId: "conv-1", userId: "user-1" }),
          data: { deletedAt: null },
        })
      );
    });

    it("creates a new conversation when none exists", async () => {
      const res = await POST(makeRequest({ memberIds: ["user-2"], isGroup: false }));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(prisma.conversation.create).toHaveBeenCalled();
    });

    it("does not match a conversation with more than 2 participants", async () => {
      const groupConvo = {
        ...mockDmConversation,
        participants: [
          makeParticipant("user-1"),
          makeParticipant("user-2"),
          makeParticipant("user-3"),
        ],
      };
      jest.mocked(prisma.conversation.findMany).mockResolvedValue([groupConvo] as any);
      await POST(makeRequest({ memberIds: ["user-2"], isGroup: false }));
      expect(prisma.conversation.create).toHaveBeenCalled();
    });

    it("does not match a conversation where the friend is not a participant", async () => {
      const convWithoutFriend = {
        ...mockDmConversation,
        participants: [makeParticipant("user-1"), makeParticipant("user-99")],
      };
      jest.mocked(prisma.conversation.findMany).mockResolvedValue([convWithoutFriend] as any);
      await POST(makeRequest({ memberIds: ["user-2"], isGroup: false }));
      expect(prisma.conversation.create).toHaveBeenCalled();
    });
  });

  describe("group conversation (findDuplicateGroupConversation + handleGroupDuplicate)", () => {
    it("returns existing group if one with identical members already exists", async () => {
      jest.mocked(prisma.conversation.findMany).mockResolvedValue([mockGroupConversation] as any);
      const res = await POST(makeRequest({ name: "Study Group", memberIds: ["user-2", "user-3"], isGroup: true }));
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.id).toBe("conv-2");
      expect(prisma.conversation.create).not.toHaveBeenCalled();
    });

    it("creates a new group when no duplicate exists", async () => {
      jest.mocked(prisma.conversation.create).mockResolvedValue(mockGroupConversation);
      const res = await POST(makeRequest({ name: "New Group", memberIds: ["user-2", "user-3"], isGroup: true }));
      expect(res.status).toBe(200);
      expect(prisma.conversation.create).toHaveBeenCalled();
    });

    it("does not match a group with different members", async () => {
      const differentGroup = {
        ...mockGroupConversation,
        participants: [
          makeParticipant("user-1", { role: "admin" }),
          makeParticipant("user-2"),
          makeParticipant("user-99"),
        ],
      };
      jest.mocked(prisma.conversation.findMany).mockResolvedValue([differentGroup] as any);
      await POST(makeRequest({ name: "New Group", memberIds: ["user-2", "user-3"], isGroup: true }));
      expect(prisma.conversation.create).toHaveBeenCalled();
    });

    it("deduplicates member IDs before checking for existing groups", async () => {
      jest.mocked(prisma.conversation.findMany).mockResolvedValue([mockGroupConversation] as any);
      const res = await POST(makeRequest({
        name: "Study Group",
        memberIds: ["user-2", "user-2", "user-3"],
        isGroup: true,
      }));
      const data = await res.json();
      expect(data.id).toBe("conv-2");
      expect(prisma.conversation.create).not.toHaveBeenCalled();
    });
  });

  describe("createConversation", () => {
    it("creates group with correct name and isGroup: true", async () => {
      jest.mocked(prisma.conversation.create).mockResolvedValue(mockGroupConversation);
      await POST(makeRequest({ name: "New Group", memberIds: ["user-2", "user-3"], isGroup: true }));
      expect(prisma.conversation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isGroup: true, name: "New Group" }),
        })
      );
    });

    it("sets creator as admin and others as members", async () => {
      jest.mocked(prisma.conversation.create).mockResolvedValue(mockGroupConversation);
      await POST(makeRequest({ name: "New Group", memberIds: ["user-2", "user-3"], isGroup: true }));
      const callArg = jest.mocked(prisma.conversation.create).mock.calls[0][0] as any;
      const participants = callArg.data.participants.create;
      const creator = participants.find((p: any) => p.userId === "user-1");
      const member = participants.find((p: any) => p.userId === "user-2");
      expect(creator.role).toBe("admin");
      expect(member.role).toBe("member");
    });

    it("sets name to null for 1-to-1 conversations", async () => {
      await POST(makeRequest({ memberIds: ["user-2"], isGroup: false }));
      expect(prisma.conversation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isGroup: false, name: null }),
        })
      );
    });
  });
});