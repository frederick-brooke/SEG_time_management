import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { GroupRole } from "@prisma/client";
import { requireSession, isGroupOwner, isGroupMember, fetchFriendsForUser, syncEventsToMember } from "../utils";

//mocks
jest.mock("@/lib/prisma", () => {
  const { mockDeep } = require("jest-mock-extended");
  return { prisma: mockDeep() };
});
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));

const prismaMock = prisma as unknown as DeepMockProxy<typeof prisma>;

//tests
describe("Group Utils", () => {
  const mockUserId = "user-123";

  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterAll(async () => {
    // Flushes pending asynchronous Prisma calls to prevent Jest open handle warnings.
    await new Promise(process.nextTick); 
  });
  describe("requireSession", () => {
    /**
     * Validates that the session guard securely throws an Error if auth fails.
     */
    it("should throw an error if the user is unauthenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      await expect(requireSession()).rejects.toThrow("Unauthorized");
    });
  });

  describe("isGroupOwner", () => {
    /**
     * Verifies the ownership check correctly parses the GroupRole enum.
     */
    it("should return true if the user role is OWNER", async () => {
      prismaMock.groupMember.findUnique.mockResolvedValue({ role: GroupRole.OWNER } as any);
      const isOwner = await isGroupOwner("group-1", mockUserId);
      expect(isOwner).toBe(true);
    });

    it("should return false if the user role is MEMBER or null", async () => {
      prismaMock.groupMember.findUnique.mockResolvedValue({ role: GroupRole.MEMBER } as any);
      const isOwner = await isGroupOwner("group-1", mockUserId);
      expect(isOwner).toBe(false);
    });
  });

  describe("fetchFriendsForUser", () => {
    /**
     * Verifies that the query properly combines friends who sent requests AND 
     * friends who received requests into one unified array.
     */
    it("should return a combined list of sent and received accepted friends", async () => {
      // Mock sent accepted requests
      prismaMock.friendRequest.findMany
        .mockResolvedValueOnce([{ receiver: { id: "friend-1" } }] as any)
        // Mock received accepted requests
        .mockResolvedValueOnce([{ sender: { id: "friend-2" } }] as any);

      const friends = await fetchFriendsForUser(mockUserId);
      expect(friends).toHaveLength(2);
      expect(friends[0].id).toBe("friend-1");
      expect(friends[1].id).toBe("friend-2");
    });
  });

  describe("syncEventsToMember", () => {
    /**
     * Verifies that when a new user joins an existing group, the app finds all 
     * distinct shared events and creates a fresh copy for the new user's calendar.
     */
    it("should fetch distinct events and duplicate them for the new user", async () => {
      prismaMock.event.findMany.mockResolvedValue([
        { groupEventGroupId: "shared-1", title: "Meeting" }
      ] as any);

      await syncEventsToMember("group-1", "new-user");

      expect(prismaMock.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ distinct: ["groupEventGroupId"] })
      );
      expect(prismaMock.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: "new-user", title: "Meeting" })
        })
      );
    });
  });
  describe("generateGroupId", () => {
    // Confirms the generated ID is a valid 24-character hex string.
    it("should generate a 24-character hex string", () => {
      const { generateGroupId } = require("../utils");
      const id = generateGroupId();
      expect(typeof id).toBe("string");
      expect(id.length).toBe(24);
    });
  });

  describe("syncTasksToMember", () => {
    // Confirms distinct shared tasks are copied over for a newly joined user.
    it("should fetch distinct tasks and duplicate them for the new user", async () => {
      const { syncTasksToMember } = require("../utils");
      prismaMock.task.findMany.mockResolvedValue([
        { groupTaskGroupId: "shared-1", title: "Homework" }
      ] as any);

      await syncTasksToMember("group-1", "new-user");

      expect(prismaMock.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ distinct: ["groupTaskGroupId"] })
      );
      expect(prismaMock.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: "new-user", title: "Homework" })
        })
      );
    });
  });
  describe("isGroupOwner and isGroupMember negative branches", () => {
    // Confirms isGroupOwner safely returns false when no membership record exists in the DB.
    it("should return false for owner check if membership is null", async () => {
      const { isGroupOwner } = require("../utils");
      prismaMock.groupMember.findUnique.mockResolvedValue(null);
      
      const isOwner = await isGroupOwner("group-1", "user-1");
      expect(isOwner).toBe(false);
    });

    // Confirms isGroupMember safely returns false when no membership record exists in the DB.
    it("should return false for member check if membership is null", async () => {
      const { isGroupMember } = require("../utils");
      prismaMock.groupMember.findUnique.mockResolvedValue(null);
      
      const isMember = await isGroupMember("group-1", "user-1");
      expect(isMember).toBe(false);
    });
  });

  describe("fetchFriendsForUser negative branches", () => {
    // Confirms fetchFriendsForUser handles users with no accepted friend requests gracefully.
    it("should return an empty array when user has no friends", async () => {
      const { fetchFriendsForUser } = require("../utils");
      prismaMock.friendRequest.findMany.mockResolvedValue([]);
      
      const friends = await fetchFriendsForUser("user-1");
      expect(friends).toEqual([]);
    });
  });
});