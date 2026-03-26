import { awardTaskPoints, revokeTaskPoints } from "./points";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    userProgress:    { findUnique: jest.fn(), update: jest.fn() },
    pointTransaction: { create: jest.fn() },
  },
}));

import { prisma } from "@/lib/prisma";

const mockFindUnique = prisma.userProgress.findUnique    as jest.Mock;
const mockUpdate     = prisma.userProgress.update        as jest.Mock;
const mockCreate     = prisma.pointTransaction.create    as jest.Mock;

function makeProgress(overrides: Record<string, unknown> = {}) {
  return { id: "prog-1", userId: "user-1", experience: 0, coins: 0, level: 1, ...overrides };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUpdate.mockResolvedValue({});
  mockCreate.mockResolvedValue({});
});

// ---------------------------------------------------------------------------
// awardTaskPoints
// ---------------------------------------------------------------------------
describe("awardTaskPoints", () => {
  it("does nothing when progress is not found", async () => {
    mockFindUnique.mockResolvedValue(null);
    await awardTaskPoints("user-1", "task-1", "High");
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it.each([
    ["Low",    10,  5],
    ["Medium", 20, 10],
    ["High",   30, 15],
  ])("awards correct XP and coins for %s priority", async (priority, xp, coins) => {
    mockFindUnique.mockResolvedValue(makeProgress());
    await awardTaskPoints("user-1", "task-1", priority);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ experience: { increment: xp }, coins }),
    }));
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ amount: coins, taskId: "task-1",
        reason: expect.stringContaining(`+${xp} XP`) }),
    }));
  });

  it("falls back to Low rewards for an unknown priority", async () => {
    mockFindUnique.mockResolvedValue(makeProgress());
    await awardTaskPoints("user-1", "task-1", "Critical");
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ experience: { increment: 10 }, coins: 5 }),
    }));
  });

  it("levels up when XP crosses a threshold", async () => {
    mockFindUnique.mockResolvedValue(makeProgress({ experience: 90 }));
    await awardTaskPoints("user-1", "task-1", "High"); // 90 + 30 = 120 → level 2
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ level: 2 }),
    }));
  });

  it("adds coins on top of an existing balance", async () => {
    mockFindUnique.mockResolvedValue(makeProgress({ coins: 50 }));
    await awardTaskPoints("user-1", "task-1", "Medium"); // 50 + 10 = 60
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ coins: 60 }),
    }));
  });
});

// ---------------------------------------------------------------------------
// revokeTaskPoints
// ---------------------------------------------------------------------------
describe("revokeTaskPoints", () => {
  it("does nothing when progress is not found", async () => {
    mockFindUnique.mockResolvedValue(null);
    await revokeTaskPoints("user-1", "task-1", "High");
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it.each([
    ["Low",    10,  5],
    ["Medium", 20, 10],
    ["High",   30, 15],
  ])("deducts correct XP and coins for %s priority", async (priority, xp, coins) => {
    mockFindUnique.mockResolvedValue(makeProgress({ experience: 100, coins: 50 }));
    await revokeTaskPoints("user-1", "task-1", priority);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ experience: { decrement: xp }, coins: 50 - coins }),
    }));
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ amount: -coins,
        reason: expect.stringContaining(`-${xp} XP`) }),
    }));
  });

  it("floors coins at 0 when balance is insufficient", async () => {
    mockFindUnique.mockResolvedValue(makeProgress({ coins: 3 }));
    await revokeTaskPoints("user-1", "task-1", "High"); // would deduct 15
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ coins: 0 }),
    }));
  });

  it("floors level at 1 when XP would go negative", async () => {
    mockFindUnique.mockResolvedValue(makeProgress({ experience: 5 }));
    await revokeTaskPoints("user-1", "task-1", "High"); // 5 - 30 clamped to 0 → level 1
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ level: 1 }),
    }));
  });

  it("levels down when XP crosses a threshold", async () => {
    mockFindUnique.mockResolvedValue(makeProgress({ experience: 110, level: 2 }));
    await revokeTaskPoints("user-1", "task-1", "High"); // 110 - 30 = 80 → level 1
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ level: 1 }),
    }));
  });
});