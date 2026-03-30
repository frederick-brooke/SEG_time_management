/**
 * Testing for profile/utils actions.
 */

import { requireSession, countFriends } from '../utils';
import { getServerSession } from "next-auth";
import { prisma } from "lib/prisma";
import { FriendStatus as PrismaFriendStatus } from "@prisma/client";

// Mocks

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("lib/auth", () => ({
  authOptions: {},
}));

// Mock Prisma client
jest.mock("lib/prisma", () => ({
  prisma: {
    friendRequest: {
      count: jest.fn(),
    },
  },
}));

describe("Backend Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("requireSession()", () => {
    it("throws an error if there is no session at all", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      await expect(requireSession()).rejects.toThrow("Unauthorized");
      expect(getServerSession).toHaveBeenCalledTimes(1);
    });

    it("throws an error if the session is missing a user email", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { id: "user-123" }, // Missing email
      });

      await expect(requireSession()).rejects.toThrow("Unauthorized");
    });

    it("throws an error if the session is missing a user ID", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { email: "test@test.com" }, // Missing id
      });

      await expect(requireSession()).rejects.toThrow("Unauthorized");
    });

    it("returns the session if it contains both an email and an ID", async () => {
      const mockSession = {
        user: { id: "user-123", email: "test@test.com" },
      };
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      const result = await requireSession();

      expect(result).toEqual(mockSession);
    });
  });

  describe("countFriends()", () => {
    it("calls prisma with the correct query and returns the count", async () => {
      const mockUserId = "user-123";
      const expectedCount = 42;
      
      // Mock the Prisma count response
      (prisma.friendRequest.count as jest.Mock).mockResolvedValue(expectedCount);

      const result = await countFriends(mockUserId);

      // Verify Prisma was called with the exact right query
      expect(prisma.friendRequest.count).toHaveBeenCalledWith({
        where: {
          status: PrismaFriendStatus.ACCEPTED,
          OR: [{ senderId: mockUserId }, { receiverId: mockUserId }],
        },
      });

      // Verify the function returns what Prisma gave it
      expect(result).toBe(expectedCount);
    });
  });
});