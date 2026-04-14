/**
 * Testing for profile/friends actions.
 */

import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelSentRequest,
  removeFriend,
} from "../friends";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireSession } from "../utils";
import { FriendStatus as PrismaFriendStatus } from "@prisma/client";

// Mocks

jest.mock("@/lib/prisma", () => ({
  prisma: {
    friendRequest: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("../utils", () => ({
  requireSession: jest.fn(),
}));

describe("Friend Request Server Actions", () => {
  const mockUserId = "user-123";
  const mockRequestId = "req-1";
  const mockReceiverId = "target-456";

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock session for all tests
    (requireSession as jest.Mock).mockResolvedValue({
      user: { id: mockUserId, email: "test@test.com" },
    });
  });

  describe("sendFriendRequest()", () => {
    it("returns an error if a request already exists between the users", async () => {
      // Mock that Prisma found an existing request
      (prisma.friendRequest.findFirst as jest.Mock).mockResolvedValue({ id: mockRequestId });

      const result = await sendFriendRequest(mockReceiverId);

      expect(prisma.friendRequest.findFirst).toHaveBeenCalled();
      expect(prisma.friendRequest.create).not.toHaveBeenCalled();
      expect(result).toEqual({ success: false, error: "Request already exists" });
    });

    it("creates a new pending request and revalidates the path if no request exists", async () => {
      (prisma.friendRequest.findFirst as jest.Mock).mockResolvedValue(null);

      await sendFriendRequest(mockReceiverId);

      expect(prisma.friendRequest.create).toHaveBeenCalledWith({
        data: {
          senderId: mockUserId,
          receiverId: mockReceiverId,
          status: PrismaFriendStatus.PENDING,
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/profile", "layout");
    });
  });

  describe("acceptFriendRequest()", () => {
    it("updates the request status to ACCEPTED using requestId and revalidates", async () => {
      await acceptFriendRequest(mockRequestId);

    expect(prisma.friendRequest.updateMany).toHaveBeenCalledWith({
      where: {
        id: mockRequestId,
        receiverId: mockUserId,
        status: PrismaFriendStatus.PENDING,
      },
        data: { status: PrismaFriendStatus.ACCEPTED },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/profile", "layout");
    });
  });

  describe("declineFriendRequest()", () => {
    it("deletes the pending request using requestId and revalidates", async () => {
      await declineFriendRequest(mockRequestId);

      expect(prisma.friendRequest.deleteMany).toHaveBeenCalledWith({
        where: {
          id: mockRequestId,
          status: PrismaFriendStatus.PENDING,
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/profile", "layout");
    });
  });

  describe("cancelSentRequest()", () => {
    it("deletes the pending request sent BY the user and revalidates", async () => {
      await cancelSentRequest(mockReceiverId);

      expect(prisma.friendRequest.deleteMany).toHaveBeenCalledWith({
        where: {
          senderId: mockUserId,
          receiverId: mockReceiverId,
          status: PrismaFriendStatus.PENDING,
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/profile", "layout");
    });
  });

  describe("removeFriend()", () => {
    it("deletes the accepted friendship in either direction and revalidates", async () => {
      await removeFriend(mockReceiverId);

      expect(prisma.friendRequest.deleteMany).toHaveBeenCalledWith({
        where: {
          status: PrismaFriendStatus.ACCEPTED,
          OR: [
            { senderId: mockUserId, receiverId: mockReceiverId },
            { senderId: mockReceiverId, receiverId: mockUserId },
          ],
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/profile", "layout");
    });
  });

  describe("Authentication Guard", () => {
    it("bubbles up the error if requireSession fails", async () => {
      // Override the default mock for just this test
      (requireSession as jest.Mock).mockRejectedValue(new Error("Unauthorized"));

      await expect(sendFriendRequest(mockReceiverId)).rejects.toThrow("Unauthorized");
      
      // Ensure database was never touched
      expect(prisma.friendRequest.findFirst).not.toHaveBeenCalled();
    });
  });
});