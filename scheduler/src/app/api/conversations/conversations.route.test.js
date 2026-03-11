import { GET, POST } from "../route";
import { getServerSession } from "next-auth";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("lib/auth", () => ({ authOptions: {} }));

jest.mock("lib/prisma", () => ({
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

import { prisma } from "lib/prisma";

const mockSession = { user: { id: "user-1" } };

const makeConversation = (overrides = {}) => ({
  id: "conv-1",
  isGroup: false,
  name: null,
  lastMessage: "hello",
  lastMessageAt: new Date("2024-01-02"),
  createdById: "user-1",
  participants: [
    { userId: "user-1", deletedAt: null, user: { id: "user-1", username: "alice", fname: "Alice", lname: null, pfp: null } },
    { userId: "user-2", deletedAt: null, user: { id: "user-2", username: "bob", fname: "Bob", lname: null, pfp: null } },
  ],
  ...overrides,
});

const makeRequest = (body) =>
  new Request("http://localhost/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => jest.clearAllMocks());

describe("GET /api/conversations", () => {
  it("returns 401 if not authenticated", async () => {
    getServerSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns conversations for authenticated user", async () => {
    getServerSession.mockResolvedValue(mockSession);
    prisma.conversation.findMany.mockResolvedValue([makeConversation()]);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("conv-1");
  });

  it("hides conversation where user cleared history and no new messages since", async () => {
    getServerSession.mockResolvedValue(mockSession);
    const conv = makeConversation({
      lastMessageAt: new Date("2024-01-01"),
      participants: [
        { userId: "user-1", deletedAt: new Date("2024-01-02"), user: { id: "user-1", username: "alice", fname: "Alice", lname: null, pfp: null } },
        { userId: "user-2", deletedAt: null, user: { id: "user-2", username: "bob", fname: "Bob", lname: null, pfp: null } },
      ],
    });
    prisma.conversation.findMany.mockResolvedValue([conv]);

    const res = await GET();
    const data = await res.json();

    expect(data).toHaveLength(0);
  });

  it("shows conversation where new message arrived after user cleared history", async () => {
    getServerSession.mockResolvedValue(mockSession);
    const conv = makeConversation({
      lastMessageAt: new Date("2024-01-03"),
      participants: [
        { userId: "user-1", deletedAt: new Date("2024-01-02"), user: { id: "user-1", username: "alice", fname: "Alice", lname: null, pfp: null } },
        { userId: "user-2", deletedAt: null, user: { id: "user-2", username: "bob", fname: "Bob", lname: null, pfp: null } },
      ],
    });
    prisma.conversation.findMany.mockResolvedValue([conv]);

    const res = await GET();
    const data = await res.json();

    expect(data).toHaveLength(1);
  });
});

describe("POST /api/conversations", () => {
  it("returns 401 if not authenticated", async () => {
    getServerSession.mockResolvedValue(null);
    const res = await POST(makeRequest({ memberIds: ["user-2"], isGroup: false }));
    expect(res.status).toBe(401);
  });

  it("returns existing DM and resets deletedAt if conversation already exists", async () => {
    getServerSession.mockResolvedValue(mockSession);
    const existing = makeConversation();
    prisma.conversation.findMany.mockResolvedValue([existing]);
    prisma.conversationParticipant.updateMany.mockResolvedValue({});

    const res = await POST(makeRequest({ memberIds: ["user-2"], isGroup: false }));
    const data = await res.json();

    expect(data.id).toBe("conv-1");
    expect(prisma.conversation.create).not.toHaveBeenCalled();
    expect(prisma.conversationParticipant.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { deletedAt: null } })
    );
  });

  it("creates a new DM conversation if none exists", async () => {
    getServerSession.mockResolvedValue(mockSession);
    prisma.conversation.findMany.mockResolvedValue([]);
    prisma.conversation.create.mockResolvedValue(makeConversation({ id: "conv-new" }));

    const res = await POST(makeRequest({ memberIds: ["user-2"], isGroup: false }));
    const data = await res.json();

    expect(prisma.conversation.create).toHaveBeenCalledTimes(1);
    expect(data.id).toBe("conv-new");
  });

  it("creates a new group conversation", async () => {
    getServerSession.mockResolvedValue(mockSession);
    prisma.conversation.findMany.mockResolvedValue([]);
    prisma.conversation.create.mockResolvedValue(
      makeConversation({ id: "group-1", isGroup: true, name: "Study Group" })
    );

    const res = await POST(makeRequest({ memberIds: ["user-2", "user-3"], isGroup: true, name: "Study Group" }));
    const data = await res.json();

    expect(data.isGroup).toBe(true);
    expect(data.name).toBe("Study Group");
  });

  it("returns existing group if same members already have a group", async () => {
    getServerSession.mockResolvedValue(mockSession);
    const existingGroup = makeConversation({
      id: "group-1",
      isGroup: true,
      name: "Study Group",
      participants: [
        { userId: "user-1", user: {} },
        { userId: "user-2", user: {} },
        { userId: "user-3", user: {} },
      ],
    });
    prisma.conversation.findMany.mockResolvedValue([existingGroup]);

    const res = await POST(makeRequest({ memberIds: ["user-2", "user-3"], isGroup: true, name: "Study Group" }));
    const data = await res.json();

    expect(data.id).toBe("group-1");
    expect(prisma.conversation.create).not.toHaveBeenCalled();
  });
});