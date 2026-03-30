/**
 * Testing for actions/leaderboard.
 */
import { getFriendsLeaderboard } from "@/app/actions/leaderboard";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { calculateStreak } from "@/lib/streak";


// Mocks

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user:          { findUnique: jest.fn(), findMany: jest.fn() },
    friendRequest: { findMany: jest.fn() },
  },
}));
jest.mock("@/lib/streak", () => ({ calculateStreak: jest.fn() }));

const mockedSession = getServerSession as jest.Mock;
const mockedStreak  = calculateStreak  as jest.Mock;
const mockedPrisma  = prisma as unknown as {
  user:          { findUnique: jest.Mock; findMany: jest.Mock };
  friendRequest: { findMany: jest.Mock };
};

// Shared fixtures

const SESSION      = { user: { email: "test@test.com" } };
const DB_USER      = { id: "user-1" };
const NO_FRIENDS   = [];

// Helpers

function task(overrides: {
  completed?: boolean;
  duration?: number;
  completedAt?: Date | null;
  createdAt?: Date;
}) {
  return {
    completed:   overrides.completed  ?? true,
    duration:    overrides.duration   ?? 0,
    completedAt: overrides.completedAt ?? new Date(),
    createdAt:   overrides.createdAt  ?? new Date(),
  };
}

function dbUser(id: string, username: string, tasks: ReturnType<typeof task>[] = []) {
  return { id, username, fname: username, lname: "", pfp: null, tasks };
}

function setupAuth(friendRows: any[] = [], userRows: any[] = [], streak = 0) {
  mockedSession.mockResolvedValue(SESSION);
  mockedPrisma.user.findUnique.mockResolvedValue(DB_USER as any);
  mockedPrisma.friendRequest.findMany.mockResolvedValue(friendRows as any);
  mockedPrisma.user.findMany.mockResolvedValue(userRows as any);
  mockedStreak.mockResolvedValue(streak);
}

// Tests

describe("getFriendsLeaderboard", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns null if user is not logged in", async () => {
    mockedSession.mockResolvedValue(null);

    const result = await getFriendsLeaderboard();

    expect(result).toBeNull();
  });

  it("returns null if session has no email", async () => {
    mockedSession.mockResolvedValue({ user: {} });

    const result = await getFriendsLeaderboard();

    expect(result).toBeNull();
  });

  it("returns null if user is not found in DB", async () => {
    mockedSession.mockResolvedValue(SESSION);
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    const result = await getFriendsLeaderboard();

    expect(result).toBeNull();
  });

  it("returns leaderboard with required fields for each entry", async () => {
    setupAuth(
      NO_FRIENDS,
      [
        dbUser("user-1", "me",      [task({ duration: 60 })]),
        dbUser("user-2", "friend1", [task({ duration: 120 })]),
        dbUser("user-3", "friend2", [task({ completed: false, duration: 0, completedAt: null })]),
      ],
      5,
    );
    mockedPrisma.friendRequest.findMany
      .mockResolvedValueOnce([{ receiverId: "user-2" }] as any)
      .mockResolvedValueOnce([{ senderId:   "user-3" }] as any);

    const result = await getFriendsLeaderboard();

    expect(result).not.toBeNull();
    expect(result).toHaveLength(3);
    expect(result![0]).toHaveProperty("streak");
    expect(result![0]).toHaveProperty("focusTime");
    expect(result![0]).toHaveProperty("completionRate");
    expect(result!.find(u => u.isCurrentUser)).toBeDefined();
  });

  it("sorts entries by streak descending", async () => {
    setupAuth(
      NO_FRIENDS,
      [dbUser("user-1", "a"), dbUser("user-2", "b")],
    );
    mockedStreak
      .mockResolvedValueOnce(2)   // user-1
      .mockResolvedValueOnce(10); // user-2

    const result = await getFriendsLeaderboard();

    expect(result![0].id).toBe("user-2");
  });

  it("filters tasks by 'day' timeframe using completedAt", async () => {
    setupAuth(
      NO_FRIENDS,
      [dbUser("user-1", "me", [
        task({ duration: 30, completedAt: new Date() }),
        task({ duration: 60, completedAt: new Date("2000-01-01") }),
      ])],
      1,
    );

    const result = await getFriendsLeaderboard("day");

    expect(result).not.toBeNull();
    expect(result![0].focusTimeRaw).toBe(30);
  });

  it("filters tasks by 'week' timeframe using completedAt", async () => {
    setupAuth(
      NO_FRIENDS,
      [dbUser("user-1", "me", [
        task({ duration: 45,  completedAt: new Date() }),
        task({ duration: 999, completedAt: new Date("2000-01-01") }),
      ])],
    );

    const result = await getFriendsLeaderboard("week");

    expect(result).not.toBeNull();
    expect(result![0].focusTimeRaw).toBe(45);
  });

  it("filters tasks by 'month' timeframe using completedAt", async () => {
    setupAuth(
      NO_FRIENDS,
      [dbUser("user-1", "me", [
        task({ duration: 90,  completedAt: new Date() }),
        task({ duration: 999, completedAt: new Date("2000-01-01") }),
      ])],
    );

    const result = await getFriendsLeaderboard("month");

    expect(result).not.toBeNull();
    expect(result![0].focusTimeRaw).toBe(90);
  });

  it("filters incomplete tasks by createdAt when a timeframe is active", async () => {
    setupAuth(
      NO_FRIENDS,
      [dbUser("user-1", "me", [
        task({ completed: false, completedAt: null, createdAt: new Date() }),
        task({ completed: false, completedAt: null, createdAt: new Date("2000-01-01") }),
      ])],
    );

    const result = await getFriendsLeaderboard("day");

    expect(result).not.toBeNull();
    expect(result![0].completionRate).toBe(0);
  });

  it("formats focus time as 'Xh Ym' when duration exceeds 60 minutes", async () => {
    setupAuth(
      NO_FRIENDS,
      [dbUser("user-1", "me", [task({ duration: 90 })])],
    );

    const result = await getFriendsLeaderboard();

    expect(result![0].focusTime).toBe("1h 30m");
  });
});