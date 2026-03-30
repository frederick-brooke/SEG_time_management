/**
 * Testing for actions/games
 */

import { payGameEntry, getGameBalance } from "../games";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { DIFFICULTY_CONFIG } from "@/lib/games-config";

// Mocks

jest.mock("@/lib/prisma", () => ({
  prisma: {
    userProgress: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    pointTransaction: {
      create: jest.fn(),
    },
  },
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Shared test data 

const USER_ID = "user-123";
const PROGRESS_ID = "progress-456";
const DIFFICULTY = "medium";
const COST = DIFFICULTY_CONFIG[DIFFICULTY].cost;

const mockSession = { user: { id: USER_ID } };
const mockProgress = { id: PROGRESS_ID, coins: COST + 50 };
const mockProgressBarelyEnough = { id: PROGRESS_ID, coins: COST };
const mockProgressInsufficient = { id: PROGRESS_ID, coins: COST - 1 };

// Helpers 

const setSession = (session: unknown) =>
  (getServerSession as jest.Mock).mockResolvedValue(session);

const setProgress = (progress: unknown) =>
  (prisma.userProgress.findUnique as jest.Mock).mockResolvedValue(progress);

const setUpdateResult = (result: unknown) =>
  (prisma.userProgress.update as jest.Mock).mockResolvedValue(result);

const setTransactionResult = (result: unknown) =>
  (prisma.pointTransaction.create as jest.Mock).mockResolvedValue(result);


// Tests for payGameEntry 

describe("payGameEntry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setSession(mockSession);
    setProgress(mockProgress);
    setUpdateResult({});
    setTransactionResult({});
  });

  describe("when unauthenticated", () => {
    it("throws Unauthorized when session is null", async () => {
      setSession(null);
      await expect(payGameEntry(DIFFICULTY)).rejects.toThrow("Unauthorized");
    });

    it("throws Unauthorized when user id is missing", async () => {
      setSession({ user: {} });
      await expect(payGameEntry(DIFFICULTY)).rejects.toThrow("Unauthorized");
    });
  });

  describe("when progress record is absent", () => {
    it("throws when no progress row exists for the user", async () => {
      setProgress(null);
      await expect(payGameEntry(DIFFICULTY)).rejects.toThrow(
        "No progress record found"
      );
    });
  });

  describe("when the user has insufficient coins", () => {
    it("throws when balance is one coin short", async () => {
      setProgress(mockProgressInsufficient);
      await expect(payGameEntry(DIFFICULTY)).rejects.toThrow(
        "Not enough coins"
      );
    });
  });

  describe("when the user has exactly enough coins", () => {
    it("succeeds without throwing", async () => {
      setProgress(mockProgressBarelyEnough);
      await expect(payGameEntry(DIFFICULTY)).resolves.not.toThrow();
    });
  });

  describe("when payment succeeds", () => {
    it("decrements coins by the difficulty cost", async () => {
      await payGameEntry(DIFFICULTY);

      expect(prisma.userProgress.update).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        data: { coins: { decrement: COST } },
      });
    });

    it("records a negative point transaction with the correct amount", async () => {
      await payGameEntry(DIFFICULTY);

      expect(prisma.pointTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          progressId: PROGRESS_ID,
          amount: -COST,
        }),
      });
    });

    it("includes the difficulty label in the transaction reason", async () => {
      await payGameEntry(DIFFICULTY);

      expect(prisma.pointTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reason: expect.stringContaining(DIFFICULTY),
        }),
      });
    });

    it("returns success: true", async () => {
      const result = await payGameEntry(DIFFICULTY);
      expect(result.success).toBe(true);
    });

    it("returns the correct new balance", async () => {
      const result = await payGameEntry(DIFFICULTY);
      expect(result.newBalance).toBe(mockProgress.coins - COST);
    });
  });

  describe("database operation ordering", () => {
    it("deducts coins before creating the transaction record", async () => {
      const callOrder: string[] = [];
      (prisma.userProgress.update as jest.Mock).mockImplementation(async () => {
        callOrder.push("update");
      });
      (prisma.pointTransaction.create as jest.Mock).mockImplementation(
        async () => {
          callOrder.push("create");
        }
      );

      await payGameEntry(DIFFICULTY);

      expect(callOrder).toEqual(["update", "create"]);
    });
  });
});

// Tests for getGameBalance 

describe("getGameBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setSession(mockSession);
  });

  describe("when unauthenticated", () => {
    it("returns 0 when session is null", async () => {
      setSession(null);
      await expect(getGameBalance()).resolves.toBe(0);
    });

    it("returns 0 when user id is missing", async () => {
      setSession({ user: {} });
      await expect(getGameBalance()).resolves.toBe(0);
    });
  });

  describe("when the user has no progress record", () => {
    it("returns 0 when progress row is null", async () => {
      setProgress(null);
      await expect(getGameBalance()).resolves.toBe(0);
    });
  });

  describe("when the user has a progress record", () => {
    it("returns the stored coin balance", async () => {
      setProgress({ coins: 250 });
      await expect(getGameBalance()).resolves.toBe(250);
    });

    it("returns 0 when coins field is explicitly zero", async () => {
      setProgress({ coins: 0 });
      await expect(getGameBalance()).resolves.toBe(0);
    });
  });

  describe("database query shape", () => {
    it("queries by the authenticated user's id", async () => {
      setProgress({ coins: 100 });
      await getGameBalance();

      expect(prisma.userProgress.findUnique).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        select: { coins: true },
      });
    });
  });
});