import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { GroupRole } from "@prisma/client";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import {
  createGroup,
  getMyGroups,
  getGroupDetails,
  getMyFriendsForGroup,
  addGroupMember,
  removeGroupMember,
  leaveGroup,
  deleteGroup,
  updateGroupSettings,
} from "../core";
import {
  requireSession,
  isGroupOwner,
  fetchFriendsForUser,
  syncEventsToMember,
  syncTasksToMember,
} from "../utils";

//mocks
jest.mock("@/lib/prisma", () => {
  const { mockDeep } = require("jest-mock-extended");
  return { prisma: mockDeep() };
});

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("../utils", () => ({
  requireSession: jest.fn(),
  isGroupOwner: jest.fn(),
  fetchFriendsForUser: jest.fn(),
  syncEventsToMember: jest.fn(),
  syncTasksToMember: jest.fn(),
  MEMBER_USER_SELECT: {},
}));

const prismaMock = prisma as unknown as DeepMockProxy<typeof prisma>;

//tests
describe("Group Core Actions", () => {
  const mockUserId = "user-123";
  const mockSession = { user: { id: mockUserId, email: "test@test.com" } };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
    (requireSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe("createGroup", () => {
    /**
     * Verifies that providing an empty or whitespace-only name fails validation
     * and returns an error without touching the database.
     */
    it("should fail if the group name is empty", async () => {
      const result = await createGroup("   ", "Description", ["friend-1"]);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/name is required/i);
      expect(prismaMock.group.create).not.toHaveBeenCalled();
    });

    /**
     * Verifies that the group requires at least one invited friend upon creation.
     */
    it("should fail if no members are provided", async () => {
      const result = await createGroup("Study Group", "Description", []);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/at least one friend/i);
      expect(prismaMock.group.create).not.toHaveBeenCalled();
    });

    /**
     * Verifies the successful creation of a group. Ensures the creator is assigned
     * the OWNER role and the provided friends are assigned MEMBER roles.
     */
    it("should successfully create a group and assign roles", async () => {
      prismaMock.group.create.mockResolvedValue({
        id: "group-1",
        name: "Study Group",
        description: "Description",
        creatorId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await createGroup("Study Group", "Description", ["friend-1"]);

      expect(result.success).toBe(true);
      expect(prismaMock.group.create).toHaveBeenCalledWith({
        data: {
          name: "Study Group",
          description: "Description",
          creatorId: mockUserId,
        },
      });
      expect(prismaMock.groupMember.createMany).toHaveBeenCalledWith({
        data: [
          { groupId: "group-1", userId: mockUserId, role: GroupRole.OWNER },
          { groupId: "group-1", userId: "friend-1", role: GroupRole.MEMBER },
        ],
      });
      expect(revalidatePath).toHaveBeenCalledWith("/groups");
    });
  });

  describe("getMyGroups", () => {
    /**
     * Ensures that calling getMyGroups without an active session safely returns
     * an empty array instead of throwing an unhandled exception.
     */
    it("should return an empty array if there is no session", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const result = await getMyGroups();
      expect(result).toEqual([]);
    });

    /**
     * Verifies that the query correctly maps the deeply nested Prisma output
     * into a flat, UI-friendly object containing the memberCount and userRole.
     */
    it("should fetch and format the user's groups correctly", async () => {
      prismaMock.groupMember.findMany.mockResolvedValue([
        {
          id: "membership-1",
          groupId: "group-1",
          userId: mockUserId,
          role: GroupRole.OWNER,
          joinedAt: new Date(),
          group: {
            id: "group-1",
            name: "Physics 101",
            description: null,
            creatorId: mockUserId,
            createdAt: new Date(),
            updatedAt: new Date(),
            creator: { id: mockUserId, username: "alice" },
            _count: { members: 3 },
          },
        } as any,
      ]);

      const result = await getMyGroups();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Physics 101");
      expect(result[0].memberCount).toBe(3);
      expect(result[0].userRole).toBe(GroupRole.OWNER);
    });
  });

  describe("getGroupDetails", () => {
    /**
     * Verifies that unauthenticated users cannot fetch group details.
     */
    it("should return null if there is no session", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const result = await getGroupDetails("group-1");
      expect(result).toBeNull();
    });

    /**
     * Verifies that if the group does not exist in the database, it safely returns null.
     */
    it("should return null if the group does not exist", async () => {
      prismaMock.group.findUnique.mockResolvedValue(null);
      const result = await getGroupDetails("group-1");
      expect(result).toBeNull();
    });

    /**
     * A crucial security test. Ensures that even if the group exists, if the current
     * user is not in the `members` array, they are denied access (returns null).
     */
    it("should return null if the user is not a member of the group", async () => {
      prismaMock.group.findUnique.mockResolvedValue({
        id: "group-1",
        members: [{ userId: "other-user", role: GroupRole.OWNER }],
      } as any);

      const result = await getGroupDetails("group-1");
      expect(result).toBeNull();
    });

    /**
     * Verifies the successful retrieval of full group details, ensuring the response
     * includes the current user's role and the total member count.
     */
    it("should return group details if the user is a valid member", async () => {
      prismaMock.group.findUnique.mockResolvedValue({
        id: "group-1",
        name: "Study Group",
        members: [
          { userId: mockUserId, role: GroupRole.MEMBER },
          { userId: "other-user", role: GroupRole.OWNER },
        ],
      } as any);

      const result = await getGroupDetails("group-1");

      expect(result).toBeDefined();
      expect(result?.userRole).toBe(GroupRole.MEMBER);
      expect(result?.memberCount).toBe(2);
    });
  });

  describe("getMyFriendsForGroup", () => {
    /**
     * Verifies it returns an empty array if the user is unauthenticated.
     */
    it("should return empty array if no session", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const result = await getMyFriendsForGroup();
      expect(result).toEqual([]);
    });

    /**
     * Verifies it properly delegates to the helper function when authenticated.
     */
    it("should call fetchFriendsForUser and return the list", async () => {
      (fetchFriendsForUser as jest.Mock).mockResolvedValue([{ id: "friend-1" }]);
      const result = await getMyFriendsForGroup();
      expect(fetchFriendsForUser).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual([{ id: "friend-1" }]);
    });
  });

  describe("addGroupMember", () => {
    /**
     * Verifies the strict permission boundary: only owners can add new members.
     */
    it("should fail if the user is not the group owner", async () => {
      (isGroupOwner as jest.Mock).mockResolvedValue(false);
      const result = await addGroupMember("group-1", "friend-1");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/only the group owner/i);
    });

    /**
     * Verifies that duplicate additions are blocked cleanly.
     */
    it("should fail if the user is already in the group", async () => {
      (isGroupOwner as jest.Mock).mockResolvedValue(true);
      prismaMock.groupMember.findUnique.mockResolvedValue({ id: "mem-1" } as any);
      
      const result = await addGroupMember("group-1", "friend-1");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/already in this group/i);
    });

    /**
     * THE HAPPY PATH: Verifies the member is added, and crucial synchronization 
     * functions are fired to ensure they receive past global tasks and events.
     */
    it("should add the member and trigger sync functions", async () => {
      (isGroupOwner as jest.Mock).mockResolvedValue(true);
      prismaMock.groupMember.findUnique.mockResolvedValue(null);

      const result = await addGroupMember("group-1", "friend-1");

      expect(result.success).toBe(true);
      expect(prismaMock.groupMember.create).toHaveBeenCalledWith({
        data: { groupId: "group-1", userId: "friend-1", role: GroupRole.MEMBER },
      });
      expect(syncEventsToMember).toHaveBeenCalledWith("group-1", "friend-1");
      expect(syncTasksToMember).toHaveBeenCalledWith("group-1", "friend-1");
      expect(revalidatePath).toHaveBeenCalledWith("/groups/group-1");
    });
  });

  describe("removeGroupMember", () => {
    /**
     * Enforces the ownership requirement for kicking members.
     */
    it("should fail if the user is not the owner", async () => {
      (isGroupOwner as jest.Mock).mockResolvedValue(false);
      const result = await removeGroupMember("group-1", "other-user");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/owner can remove/i);
    });

    /**
     * Prevents the owner from accidentally kicking themselves and stranding the group.
     */
    it("should prevent the owner from removing themselves", async () => {
      (isGroupOwner as jest.Mock).mockResolvedValue(true);
      const result = await removeGroupMember("group-1", mockUserId);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/cannot remove themselves/i);
    });

    /**
     * Verifies a successful removal, ensuring that the target user's personal
     * copies of group events and tasks are correctly purged to prevent orphaned data.
     */
    it("should remove the member and delete their assigned group data", async () => {
      (isGroupOwner as jest.Mock).mockResolvedValue(true);

      const result = await removeGroupMember("group-1", "other-user");

      expect(result.success).toBe(true);
      expect(prismaMock.groupMember.delete).toHaveBeenCalledWith({
        where: { groupId_userId: { groupId: "group-1", userId: "other-user" } },
      });
      expect(prismaMock.event.deleteMany).toHaveBeenCalledWith({
        where: { groupId: "group-1", userId: "other-user", isGroupEvent: true },
      });
      expect(prismaMock.task.deleteMany).toHaveBeenCalledWith({
        where: { groupId: "group-1", userId: "other-user", isGroupTask: true },
      });
    });
  });

  describe("leaveGroup", () => {
    /**
     * Validates that an unassociated user cannot leave a group they aren't in.
     */
    it("should fail if the user is not a member", async () => {
      prismaMock.groupMember.findUnique.mockResolvedValue(null);
      const result = await leaveGroup("group-1");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/not a member/i);
    });

    /**
     * Prevents owners from abandoning a group without formally deleting it.
     */
    it("should fail if the user is the OWNER", async () => {
      prismaMock.groupMember.findUnique.mockResolvedValue({
        role: GroupRole.OWNER,
      } as any);

      const result = await leaveGroup("group-1");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/owners cannot leave/i);
    });

    /**
     * Verifies that a regular member can leave, and that their personal copies
     * of group data are purged appropriately upon departure.
     */
    it("should process leaving and purge user data correctly", async () => {
      prismaMock.groupMember.findUnique.mockResolvedValue({
        role: GroupRole.MEMBER,
      } as any);

      const result = await leaveGroup("group-1");

      expect(result.success).toBe(true);
      expect(prismaMock.groupMember.delete).toHaveBeenCalledWith({
        where: { groupId_userId: { groupId: "group-1", userId: mockUserId } },
      });
      expect(prismaMock.event.deleteMany).toHaveBeenCalledWith({
        where: { groupId: "group-1", userId: mockUserId, isGroupEvent: true },
      });
      expect(prismaMock.task.deleteMany).toHaveBeenCalledWith({
        where: { groupId: "group-1", userId: mockUserId, isGroupTask: true },
      });
    });
  });

  describe("deleteGroup", () => {
    /**
     * Verifies only the owner can execute the destructive delete action.
     */
    it("should fail if the user is not the owner", async () => {
      (isGroupOwner as jest.Mock).mockResolvedValue(false);
      const result = await deleteGroup("group-1");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/only the group owner/i);
    });

    /**
     * Verifies that an authorized owner successfully deletes the group.
     */
    it("should delete the group successfully", async () => {
      (isGroupOwner as jest.Mock).mockResolvedValue(true);
      const result = await deleteGroup("group-1");

      expect(result.success).toBe(true);
      expect(prismaMock.group.delete).toHaveBeenCalledWith({
        where: { id: "group-1" },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/groups");
    });
  });

  describe("updateGroupSettings", () => {
    /**
     * Verifies permission boundary on settings changes.
     */
    it("should fail if the user is not the owner", async () => {
      (isGroupOwner as jest.Mock).mockResolvedValue(false);
      const result = await updateGroupSettings("group-1", {
        name: "New Name",
        description: null,
      });
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/only group owners/i);
    });

    /**
     * Verifies successful updates, explicitly ensuring strings are trimmed
     * prior to database insertion.
     */
    it("should update the group settings and trim inputs", async () => {
      (isGroupOwner as jest.Mock).mockResolvedValue(true);
      const result = await updateGroupSettings("group-1", {
        name: "  New Name  ",
        description: "  New Desc  ",
      });

      expect(result.success).toBe(true);
      expect(prismaMock.group.update).toHaveBeenCalledWith({
        where: { id: "group-1" },
        data: { name: "New Name", description: "New Desc" },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/groups/group-1");
    });
  });
});