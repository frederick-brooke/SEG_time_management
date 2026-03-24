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
});