import { getFriendsLeaderboard } from "@/app/actions/leaderboard";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { calculateStreak } from "@/lib/streak";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    friendRequest: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("@/lib/streak", () => ({
  calculateStreak: jest.fn(),
}));

const mockedSession = getServerSession as jest.Mock;
const mockedPrisma = prisma as unknown as {
    user: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
    friendRequest: {
      findMany: jest.Mock;
    };
  };
const mockedStreak = calculateStreak as jest.Mock;

describe("getFriendsLeaderboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null if user is not logged in", async () => {
    mockedSession.mockResolvedValue(null);

    const result = await getFriendsLeaderboard();

    expect(result).toBeNull();
  });

  it("returns null if user is not found in DB", async () => {
    mockedSession.mockResolvedValue({
      user: { email: "test@test.com" },
    });

    mockedPrisma.user.findUnique.mockResolvedValue(null);

    const result = await getFriendsLeaderboard();

    expect(result).toBeNull();
  });

  it("returns leaderboard sorted by streak then focus time", async () => {
    mockedSession.mockResolvedValue({
      user: { email: "test@test.com" },
    });

    mockedPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
    } as any);

    // friends
    mockedPrisma.friendRequest.findMany
      .mockResolvedValueOnce([
        { receiverId: "user-2" },
      ] as any)
      .mockResolvedValueOnce([
        { senderId: "user-3" },
      ] as any);

    mockedPrisma.user.findMany.mockResolvedValue([
      {
        id: "user-1",
        username: "me",
        fname: "Me",
        lname: "User",
        pfp: null,
        tasks: [
          { completed: true, duration: 60, completedAt: new Date(), createdAt: new Date() },
        ],
      },
      {
        id: "user-2",
        username: "friend1",
        fname: "Friend",
        lname: "One",
        pfp: null,
        tasks: [
          { completed: true, duration: 120, completedAt: new Date(), createdAt: new Date() },
        ],
      },
      {
        id: "user-3",
        username: "friend2",
        fname: "Friend",
        lname: "Two",
        pfp: null,
        tasks: [
          { completed: false, duration: 0, completedAt: null, createdAt: new Date() },
        ],
      },
    ] as any);

    mockedStreak.mockResolvedValue(5);

    const result = await getFriendsLeaderboard();

    expect(result).not.toBeNull();
    expect(result!.length).toBe(3);

    expect(result![0]).toHaveProperty("streak");
    expect(result![0]).toHaveProperty("focusTime");
    expect(result![0]).toHaveProperty("completionRate");

    expect(result!.find(u => u.isCurrentUser)).toBeDefined();
  });

  it("sorts by streak first", async () => {
    mockedSession.mockResolvedValue({
      user: { email: "test@test.com" },
    });

    mockedPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
    } as any);

    mockedPrisma.friendRequest.findMany.mockResolvedValue([]);

    mockedPrisma.user.findMany.mockResolvedValue([
      {
        id: "user-1",
        username: "a",
        fname: "A",
        lname: "",
        pfp: null,
        tasks: [],
      },
      {
        id: "user-2",
        username: "b",
        fname: "B",
        lname: "",
        pfp: null,
        tasks: [],
      },
    ] as any);

    mockedStreak
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(10);

    const result = await getFriendsLeaderboard();

    expect(result![0].id).toBe("user-2");
  });

  it("returns null if session has no email", async () => {
    mockedSession.mockResolvedValue({ user: {} });
    const result = await getFriendsLeaderboard();
    expect(result).toBeNull();
  });

  it("filters tasks by day timeframe using completedAt", async () => {
    mockedSession.mockResolvedValue({ user: { email: "test@test.com" } });
    mockedPrisma.user.findUnique.mockResolvedValue({ id: "user-1" } as any);
    mockedPrisma.friendRequest.findMany.mockResolvedValue([]);
    mockedPrisma.user.findMany.mockResolvedValue([
      {
        id: "user-1",
        username: "me",
        fname: "Me",
        lname: "",
        pfp: null,
        tasks: [
          { completed: true, duration: 30, completedAt: new Date(), createdAt: new Date() },
          { completed: true, duration: 60, completedAt: new Date("2000-01-01"), createdAt: new Date("2000-01-01") },
        ],
      },
    ] as any);
    mockedStreak.mockResolvedValue(1);

    const result = await getFriendsLeaderboard("day");

    expect(result).not.toBeNull();
    expect(result![0].focusTimeRaw).toBe(30);
  });

  it("filters tasks by week timeframe", async () => {
    mockedSession.mockResolvedValue({ user: { email: "test@test.com" } });
    mockedPrisma.user.findUnique.mockResolvedValue({ id: "user-1" } as any);
    mockedPrisma.friendRequest.findMany.mockResolvedValue([]);
    mockedPrisma.user.findMany.mockResolvedValue([
      {
        id: "user-1",
        username: "me",
        fname: "Me",
        lname: "",
        pfp: null,
        tasks: [
          { completed: true, duration: 45, completedAt: new Date(), createdAt: new Date() },
          { completed: true, duration: 999, completedAt: new Date("2000-01-01"), createdAt: new Date("2000-01-01") },
        ],
      },
    ] as any);
    mockedStreak.mockResolvedValue(0);

    const result = await getFriendsLeaderboard("week");

    expect(result).not.toBeNull();
    expect(result![0].focusTimeRaw).toBe(45);
  });

  it("filters tasks by month timeframe", async () => {
    mockedSession.mockResolvedValue({ user: { email: "test@test.com" } });
    mockedPrisma.user.findUnique.mockResolvedValue({ id: "user-1" } as any);
    mockedPrisma.friendRequest.findMany.mockResolvedValue([]);
    mockedPrisma.user.findMany.mockResolvedValue([
      {
        id: "user-1",
        username: "me",
        fname: "Me",
        lname: "",
        pfp: null,
        tasks: [
          { completed: true, duration: 90, completedAt: new Date(), createdAt: new Date() },
          { completed: true, duration: 999, completedAt: new Date("2000-01-01"), createdAt: new Date("2000-01-01") },
        ],
      },
    ] as any);
    mockedStreak.mockResolvedValue(0);

    const result = await getFriendsLeaderboard("month");

    expect(result).not.toBeNull();
    expect(result![0].focusTimeRaw).toBe(90);
  });

  it("filters incomplete tasks by createdAt when dateThreshold is set", async () => {
    mockedSession.mockResolvedValue({ user: { email: "test@test.com" } });
    mockedPrisma.user.findUnique.mockResolvedValue({ id: "user-1" } as any);
    mockedPrisma.friendRequest.findMany.mockResolvedValue([]);
    mockedPrisma.user.findMany.mockResolvedValue([
      {
        id: "user-1",
        username: "me",
        fname: "Me",
        lname: "",
        pfp: null,
        tasks: [
          { completed: false, duration: 0, completedAt: null, createdAt: new Date() },
          { completed: false, duration: 0, completedAt: null, createdAt: new Date("2000-01-01") },
        ],
      },
    ] as any);
    mockedStreak.mockResolvedValue(0);

    const result = await getFriendsLeaderboard("day");

    expect(result).not.toBeNull();
    expect(result![0].completionRate).toBe(0);
  });

  it("formats focus time as hours and minutes when over 60 minutes", async () => {
    mockedSession.mockResolvedValue({ user: { email: "test@test.com" } });
    mockedPrisma.user.findUnique.mockResolvedValue({ id: "user-1" } as any);
    mockedPrisma.friendRequest.findMany.mockResolvedValue([]);
    mockedPrisma.user.findMany.mockResolvedValue([
      {
        id: "user-1",
        username: "me",
        fname: "Me",
        lname: "",
        pfp: null,
        tasks: [
          { completed: true, duration: 90, completedAt: new Date(), createdAt: new Date() },
        ],
      },
    ] as any);
    mockedStreak.mockResolvedValue(0);

    const result = await getFriendsLeaderboard();

    expect(result![0].focusTime).toBe("1h 30m");
  });
});