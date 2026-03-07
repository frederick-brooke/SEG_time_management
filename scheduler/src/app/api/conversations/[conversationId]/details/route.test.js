import { GET } from "../route";

jest.mock("lib/prisma", () => ({
  prisma: {
    conversation: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from "lib/prisma";

const makeParams = (conversationId) => Promise.resolve({ conversationId });
const makeRequest = () => new Request("http://localhost/api/conversations/conv-1/details");

const mockConversation = {
  id: "conv-1",
  isGroup: true,
  name: "Study Group",
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

beforeEach(() => jest.clearAllMocks());

describe("GET /details", () => {
  it("returns conversation details with participants", async () => {
    prisma.conversation.findUnique.mockResolvedValue(mockConversation);

    const res = await GET(makeRequest(), { params: makeParams("conv-1") });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe("conv-1");
    expect(data.name).toBe("Study Group");
    expect(data.participants).toHaveLength(2);
  });

  it("queries with the correct conversationId", async () => {
    prisma.conversation.findUnique.mockResolvedValue(mockConversation);

    await GET(makeRequest(), { params: makeParams("conv-1") });

    expect(prisma.conversation.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "conv-1" } })
    );
  });

  it("returns participants ordered by joinedAt ascending", async () => {
    prisma.conversation.findUnique.mockResolvedValue(mockConversation);

    const res = await GET(makeRequest(), { params: makeParams("conv-1") });
    const data = await res.json();

    const callArgs = prisma.conversation.findUnique.mock.calls[0][0];
    expect(callArgs.select.participants.orderBy).toEqual({ joinedAt: "asc" });
    expect(data.participants[0].role).toBe("admin");
    expect(data.participants[1].role).toBe("member");
  });

  it("returns null when conversation does not exist", async () => {
    prisma.conversation.findUnique.mockResolvedValue(null);

    const res = await GET(makeRequest(), { params: makeParams("nonexistent") });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toBeNull();
  });

  it("includes the correct fields for each participant", async () => {
    prisma.conversation.findUnique.mockResolvedValue(mockConversation);

    const res = await GET(makeRequest(), { params: makeParams("conv-1") });
    const data = await res.json();

    const participant = data.participants[0];
    expect(participant).toHaveProperty("userId");
    expect(participant).toHaveProperty("role");
    expect(participant).toHaveProperty("joinedAt");
    expect(participant.user).toHaveProperty("username");
    expect(participant.user).toHaveProperty("fname");
    expect(participant.user).toHaveProperty("pfp");
  });
});