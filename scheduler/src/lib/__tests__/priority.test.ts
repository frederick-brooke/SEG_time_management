import { awardTaskPoints, revokeTaskPoints } from "../points";
import { prisma } from "@/lib/prisma";

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

describe("Points System Library", () => {
  const mockUserId = "user-123";
  const mockTaskId = "task-456";
  const mockProgressId = "prog-789";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("awardTaskPoints", () => {
    it("returns early if no user progress is found", async () => {
      (prisma.userProgress.findUnique as jest.Mock).mockResolvedValue(null);

      await awardTaskPoints(mockUserId, mockTaskId, "High");

      expect(prisma.userProgress.update).not.toHaveBeenCalled();
      expect(prisma.pointTransaction.create).not.toHaveBeenCalled();
    });

    it("awards points correctly for High priority and triggers level up", async () => {
      (prisma.userProgress.findUnique as jest.Mock).mockResolvedValue({
        id: mockProgressId,
        experience: 90,
        coins: 10,
      });

      await awardTaskPoints(mockUserId, mockTaskId, "High");

      expect(prisma.userProgress.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: {
          experience: { increment: 30 },
          coins: 25,
          level: 2, 
        },
      });

      expect(prisma.pointTransaction.create).toHaveBeenCalledWith({
        data: {
          progressId: mockProgressId,
          taskId: mockTaskId,
          amount: 15,
          reason: "Task completed (High) — +30 XP, +15 coins",
        },
      });
    });

    it("defaults to Low reward for unknown priorities and handles null coins", async () => {
      (prisma.userProgress.findUnique as jest.Mock).mockResolvedValue({
        id: mockProgressId,
        experience: 50,
        coins: null,
      });

      await awardTaskPoints(mockUserId, mockTaskId, "UnknownPriority");

      expect(prisma.userProgress.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: {
          experience: { increment: 10 },
          coins: 5, 
          level: 1,
        },
      });

      expect(prisma.pointTransaction.create).toHaveBeenCalledWith({
        data: {
          progressId: mockProgressId,
          taskId: mockTaskId,
          amount: 5,
          reason: "Task completed (UnknownPriority) — +10 XP, +5 coins",
        },
      });
    });
  });

  describe("revokeTaskPoints", () => {
    it("returns early if no user progress is found", async () => {
      (prisma.userProgress.findUnique as jest.Mock).mockResolvedValue(null);

      await revokeTaskPoints(mockUserId, mockTaskId, "Medium");

      expect(prisma.userProgress.update).not.toHaveBeenCalled();
      expect(prisma.pointTransaction.create).not.toHaveBeenCalled();
    });

    it("revokes points correctly for Medium priority", async () => {
      (prisma.userProgress.findUnique as jest.Mock).mockResolvedValue({
        id: mockProgressId,
        experience: 150,
        coins: 50,
      });

      await revokeTaskPoints(mockUserId, mockTaskId, "Medium");

      expect(prisma.userProgress.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: {
          experience: { decrement: 20 },
          coins: 40, 
          level: 2, 
      });

      expect(prisma.pointTransaction.create).toHaveBeenCalledWith({
        data: {
          progressId: mockProgressId,
          taskId: mockTaskId,
          amount: -10,
          reason: "Task un-completed (Medium) — -20 XP, -10 coins",
        },
      });
    });

    it("prevents coins and XP from going below zero during revocation", async () => {
      (prisma.userProgress.findUnique as jest.Mock).mockResolvedValue({
        id: mockProgressId,
        experience: 10,
        coins: 5,
      });

      await revokeTaskPoints(mockUserId, mockTaskId, "High");

      expect(prisma.userProgress.update).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: {
          experience: { decrement: 30 },
          coins: 0, 
          level: 1, 
      });

      expect(prisma.pointTransaction.create).toHaveBeenCalledWith({
        data: {
          progressId: mockProgressId,
          taskId: mockTaskId,
          amount: -15,
          reason: "Task un-completed (High) — -30 XP, -15 coins",
        },
      });
    });
  });
});