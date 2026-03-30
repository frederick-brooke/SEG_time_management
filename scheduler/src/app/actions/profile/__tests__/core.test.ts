/**
 * Testing for profile/core actions.
 */

import { getMyProfile, getProfile, updateProfile } from "../core"; // Adjust path
import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { calculateStreak } from "lib/streak";
import {
  fetchUserByUsername,
  fetchFriends,
  fetchFriendCount,
  fetchFriendStatus,
  computeTaskStats,
} from "lib/profile-queries";
import { requireSession, countFriends } from "../utils";
import { FriendStatus as PrismaFriendStatus } from "@prisma/client";

// Mocks

jest.mock("lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn(), update: jest.fn() },
    userProgress: { findUnique: jest.fn() },
    task: { findMany: jest.fn() },
    friendRequest: { findMany: jest.fn() },
  },
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("lib/auth", () => ({ authOptions: {} }));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("lib/streak", () => ({
  calculateStreak: jest.fn(),
}));

jest.mock("lib/profile-queries", () => ({
  fetchUserByUsername: jest.fn(),
  fetchFriends: jest.fn(),
  fetchFriendCount: jest.fn(),
  fetchFriendStatus: jest.fn(),
  computeTaskStats: jest.fn(),
}));

jest.mock("../utils", () => ({
  requireSession: jest.fn(),
  countFriends: jest.fn(),
}));

// Mock global fetch for geocoding
global.fetch = jest.fn();

// Tests

describe("Profile Server Actions", () => {
  const mockUserId = "user-123";
  const mockEmail = "test@test.com";

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENCAGE_API_KEY = "test-api-key"; // Mock env var
    
    // Silence console warnings/errors during tests to keep output clean
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("getMyProfile()", () => {
    it("returns null if there is no active session", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const result = await getMyProfile();
      expect(result).toBeNull();
    });

    it("returns null if the user does not exist in the database", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: { email: mockEmail } });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      
      const result = await getMyProfile();
      expect(result).toBeNull();
    });

    it("aggregates and returns the user's full profile data", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: { email: mockEmail } });
      
      // Mock DB responses
      const mockDbUser = { id: mockUserId, username: "testuser", email: mockEmail };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
      (prisma.userProgress.findUnique as jest.Mock).mockResolvedValue({ level: 5 });
      (prisma.task.findMany as jest.Mock).mockResolvedValue([
        { completed: true }, { completed: false }
      ]);
      
      // Mock Friend Requests (Pending, Sent Accepted, Received Accepted)
      (prisma.friendRequest.findMany as jest.Mock)
        .mockResolvedValueOnce([{ sender: { id: "sender-1" } }]) // Pending
        .mockResolvedValueOnce([{ receiver: { id: "friend-1" } }]) // Sent Accepted
        .mockResolvedValueOnce([{ sender: { id: "friend-2" } }]); // Received Accepted

      (countFriends as jest.Mock).mockResolvedValue(2);
      (calculateStreak as jest.Mock).mockResolvedValue(10);

      const result = await getMyProfile();

      expect(result).toEqual({
        ...mockDbUser,
        progress: { level: 5 },
        receivedRequests: [{ sender: { id: "sender-1" } }],
        friends: [{ id: "friend-1" }, { id: "friend-2" }],
        stats: {
          completedTasks: 1,
          totalTasks: 2,
          completionRate: 50,
          friendCount: 2,
          streak: 10,
        },
        friendStatus: "ME",
      });
    });
  });

  describe("getProfile()", () => {
    it("returns null if the target user is not found", async () => {
      (fetchUserByUsername as jest.Mock).mockResolvedValue(null);
      
      const result = await getProfile("unknownuser");
      expect(result).toBeNull();
    });

    it("fetches and formats a public profile", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "viewer-1" } });
      
      const mockTargetUser = { id: "target-1", username: "targetuser", tasks: [] };
      (fetchUserByUsername as jest.Mock).mockResolvedValue(mockTargetUser);
      
      (fetchFriends as jest.Mock).mockResolvedValue([{ id: "friend-1" }]);
      (fetchFriendCount as jest.Mock).mockResolvedValue(1);
      (calculateStreak as jest.Mock).mockResolvedValue(5);
      (fetchFriendStatus as jest.Mock).mockResolvedValue({ status: "ACCEPTED", requestId: "req-1" });
      (computeTaskStats as jest.Mock).mockReturnValue({ completedTasks: 0, totalTasks: 0, completionRate: 0 });

      const result = await getProfile("targetuser");

      expect(fetchFriendStatus).toHaveBeenCalledWith("viewer-1", "target-1");
      expect(result).toEqual({
        ...mockTargetUser,
        friends: [{ id: "friend-1" }],
        stats: { completedTasks: 0, totalTasks: 0, completionRate: 0, friendCount: 1, streak: 5 },
        friendStatus: "ACCEPTED",
        requestId: "req-1",
      });
    });
  });

  describe("updateProfile()", () => {
    let mockFormData: FormData;

    beforeEach(() => {
      (requireSession as jest.Mock).mockResolvedValue({ user: { id: mockUserId } });
      
      // Create a mock FormData object
      mockFormData = {
        get: jest.fn(),
      } as unknown as FormData;
    });

    it("updates basic profile info and clears location if city/country are missing", async () => {
      (mockFormData.get as jest.Mock).mockImplementation((key) => {
        if (key === "fname") return "John";
        if (key === "bio") return "Hello world";
        return null;
      });

      await updateProfile(mockFormData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          fname: "John",
          lname: null,
          bio: "Hello world",
          city: null,
          country: null,
        },
      });
      expect(global.fetch).not.toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/profile");
    });

    it("geocodes city and country when both are provided", async () => {
      (mockFormData.get as jest.Mock).mockImplementation((key) => {
        if (key === "city") return "London";
        if (key === "country") return "UK";
        return null;
      });

      // Mock a successful OpenCage API response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [{ geometry: { lat: 51.5074, lng: -0.1278 } }],
        }),
      });

      await updateProfile(mockFormData);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: expect.objectContaining({
          city: "London",
          country: "UK",
          location: { lat: 51.5074, lng: -0.1278 },
        }),
      });
    });

    it("skips geocoding and sets location to null if API key is missing", async () => {
      delete process.env.OPENCAGE_API_KEY; // Remove API key for this test

      (mockFormData.get as jest.Mock).mockImplementation((key) => {
        if (key === "city") return "London";
        if (key === "country") return "UK";
        return null;
      });

      await updateProfile(mockFormData);

      expect(global.fetch).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith("OPENCAGE_API_KEY is not set; skipping geocoding.");
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: expect.objectContaining({
          location: null,
        }),
      });
    });

    it("sets location to null if the geocoding fetch request fails", async () => {
      (mockFormData.get as jest.Mock).mockImplementation((key) => {
        if (key === "city") return "Nowhere";
        if (key === "country") return "Void";
        return null;
      });

      // Mock a failed API response
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 403 });

      await updateProfile(mockFormData);

      expect(console.error).toHaveBeenCalledWith("Geocoding request failed with status:", 403);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: expect.objectContaining({
          location: null,
        }),
      });
    });
  });
});