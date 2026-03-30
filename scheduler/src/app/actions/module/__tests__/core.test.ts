/**
 * Testing for module/core actions.
 */

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { ModuleRole } from "@prisma/client";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import {
  createModule,
  joinModule,
  getMyModules,
  getModuleDetails,
  leaveModule,
  updateModuleSettings,
  updateMemberRole,
  removeMember,
} from "../core";
import {
  requireSession,
  generateUniquePin,
  isModuleOwner,
  syncEventsToMember,
  syncTasksToMember,
} from "../utils";

// Mocks

jest.mock("@/lib/prisma", () => {
  const { mockDeep } = require("jest-mock-extended");
  return { prisma: mockDeep() };
});
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("../utils", () => ({
  requireSession: jest.fn(),
  generateUniquePin: jest.fn(),
  isModuleOwner: jest.fn(),
  syncEventsToMember: jest.fn(),
  syncTasksToMember: jest.fn(),
}));

const prismaMock = prisma as unknown as DeepMockProxy<typeof prisma>;

// Helpers

/**
 * Converts a key-value record into FormData
 * @param {Record<string, string>} fields - Data to convert
 * @return {FormData}
 */
function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
  return fd;
}

// Tests

describe("Module Core Actions", () => {
  const mockUserId = "user-123";
  const mockSession = { user: { id: mockUserId, email: "test@test.com" } };

  beforeEach(() => {
    jest.clearAllMocks();
    (requireSession as jest.Mock).mockResolvedValue(mockSession);
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe("createModule", () => {
    /**
     * Validates that empty names are rejected before hitting the database.
     */
    it("should fail if the module name is empty", async () => {
      const fd = makeFormData({ name: "   ", description: "", maxMembers: "50" });
      const result = await createModule(fd);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/name is required/i);
    });

    /**
     * Validates the capacity limits (min 2, max 100).
     */
    it("should fail if max members is out of bounds", async () => {
      const fd = makeFormData({ name: "Physics", description: "", maxMembers: "150" });
      const result = await createModule(fd);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/between 2 and 100/i);
    });

      describe("createModule (additional branches)", () => {
    it("should fail if max members is below 2", async () => {
      const fd = makeFormData({ name: "Physics", description: "", maxMembers: "1" });
      const result = await createModule(fd);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/between 2 and 100/i);
    });

    it("should default maxMembers to 50 if not provided", async () => {
      const fd = makeFormData({ name: "Physics", description: "" });
      (generateUniquePin as jest.Mock).mockResolvedValue("ABC123");
      prismaMock.module.create.mockResolvedValue({ id: "mod-1" } as any);
      const result = await createModule(fd);
      expect(result.success).toBe(true);
    });

    it("should create module with no description", async () => {
      const fd = makeFormData({ name: "Physics", maxMembers: "10" });
      (generateUniquePin as jest.Mock).mockResolvedValue("ABC123");
      prismaMock.module.create.mockResolvedValue({ id: "mod-1" } as any);
      const result = await createModule(fd);
      expect(result.success).toBe(true);
    });
  });

  describe("joinModule (additional branches)", () => {
    it("should fail if module is not found", async () => {
      prismaMock.module.findUnique.mockResolvedValue(null);
      const result = await joinModule("ABC123");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/module not found/i);
    });

    it("should fail if user is already a member", async () => {
      prismaMock.module.findUnique.mockResolvedValue({
        id: "mod-1", maxMembers: 50, _count: { members: 5 }
      } as any);
      prismaMock.moduleMember.findUnique.mockResolvedValue({ id: "existing" } as any);
      const result = await joinModule("ABC123");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/already a member/i);
    });
  });

  describe("getMyModules", () => {
    it("should return empty array if no session", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const result = await getMyModules();
      expect(result).toEqual([]);
    });

    it("should return modules with memberCount and userRole", async () => {
      prismaMock.moduleMember.findMany.mockResolvedValue([
        {
          role: ModuleRole.OWNER,
          module: {
            id: "mod-1",
            joinPin: "ABC123",
            _count: { members: 3 },
            creator: { username: "karim", fname: "Karim", lname: "K" },
          },
        },
      ] as any);
      const result = await getMyModules();
      expect(result[0].memberCount).toBe(3);
      expect(result[0].userRole).toBe(ModuleRole.OWNER);
      expect(result[0].joinPin).toBe("ABC123");
    });

    it("should hide joinPin from non-owners", async () => {
      prismaMock.moduleMember.findMany.mockResolvedValue([
        {
          role: ModuleRole.MEMBER,
          module: {
            id: "mod-1",
            joinPin: "SECRET",
            _count: { members: 3 },
            creator: { username: "karim", fname: "Karim", lname: "K" },
          },
        },
      ] as any);
      const result = await getMyModules();
      expect(result[0].joinPin).toBeUndefined();
    });
  });

  describe("getModuleDetails", () => {
    it("should return null if no session", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const result = await getModuleDetails("mod-1");
      expect(result).toBeNull();
    });

    it("should return null if module not found", async () => {
      prismaMock.module.findUnique.mockResolvedValue(null);
      const result = await getModuleDetails("mod-1");
      expect(result).toBeNull();
    });

    it("should return null if user is not a member", async () => {
      prismaMock.module.findUnique.mockResolvedValue({
        id: "mod-1",
        members: [{ userId: "other-user", role: ModuleRole.MEMBER }],
      } as any);
      const result = await getModuleDetails("mod-1");
      expect(result).toBeNull();
    });

    it("should return module details with joinPin for owner", async () => {
      prismaMock.module.findUnique.mockResolvedValue({
        id: "mod-1",
        joinPin: "ABC123",
        members: [{ userId: mockUserId, role: ModuleRole.OWNER, user: {} }],
      } as any);
      const result = await getModuleDetails("mod-1");
      expect(result).not.toBeNull();
      expect(result!.joinPin).toBe("ABC123");
      expect(result!.userRole).toBe(ModuleRole.OWNER);
    });

    it("should hide joinPin for non-owner member", async () => {
      prismaMock.module.findUnique.mockResolvedValue({
        id: "mod-1",
        joinPin: "SECRET",
        members: [{ userId: mockUserId, role: ModuleRole.MEMBER, user: {} }],
      } as any);
      const result = await getModuleDetails("mod-1");
      expect(result!.joinPin).toBeUndefined();
    });
  });

  describe("leaveModule (additional branches)", () => {
    it("should fail if user is not a member", async () => {
      prismaMock.moduleMember.findUnique.mockResolvedValue(null);
      const result = await leaveModule("mod-1");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/not a member/i);
    });
  });

  describe("updateModuleSettings", () => {
    it("should fail if not the owner", async () => {
      (isModuleOwner as jest.Mock).mockResolvedValue(false);
      const result = await updateModuleSettings("mod-1", { name: "X", description: "", maxMembers: 10 });
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/only module owners/i);
    });

    it("should fail if maxMembers is out of bounds", async () => {
      (isModuleOwner as jest.Mock).mockResolvedValue(true);
      const result = await updateModuleSettings("mod-1", { name: "X", description: "", maxMembers: 1 });
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/between 2 and 100/i);
    });

    it("should fail if maxMembers is less than current member count", async () => {
      (isModuleOwner as jest.Mock).mockResolvedValue(true);
      prismaMock.moduleMember.count.mockResolvedValue(10);
      const result = await updateModuleSettings("mod-1", { name: "X", description: "", maxMembers: 5 });
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/cannot set max members lower/i);
    });

    it("should successfully update settings", async () => {
      (isModuleOwner as jest.Mock).mockResolvedValue(true);
      prismaMock.moduleMember.count.mockResolvedValue(3);
      prismaMock.module.update.mockResolvedValue({} as any);
      const result = await updateModuleSettings("mod-1", { name: "New Name", description: "Desc", maxMembers: 10 });
      expect(result.success).toBe(true);
      expect(revalidatePath).toHaveBeenCalledWith("/modules/mod-1");
    });

    it("should handle null description", async () => {
      (isModuleOwner as jest.Mock).mockResolvedValue(true);
      prismaMock.moduleMember.count.mockResolvedValue(3);
      prismaMock.module.update.mockResolvedValue({} as any);
      const result = await updateModuleSettings("mod-1", { name: "New Name", description: "", maxMembers: 10 });
      expect(result.success).toBe(true);
    });
  });

  describe("updateMemberRole", () => {
    it("should fail if not the owner", async () => {
      (isModuleOwner as jest.Mock).mockResolvedValue(false);
      const result = await updateMemberRole("mod-1", "other-user", "ADMIN");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/only module owners/i);
    });

    it("should fail if trying to change own role", async () => {
      (isModuleOwner as jest.Mock).mockResolvedValue(true);
      const result = await updateMemberRole("mod-1", mockUserId, "ADMIN");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/cannot change your own role/i);
    });

    it("should successfully update a member role", async () => {
      (isModuleOwner as jest.Mock).mockResolvedValue(true);
      prismaMock.moduleMember.update.mockResolvedValue({} as any);
      const result = await updateMemberRole("mod-1", "other-user", "ADMIN");
      expect(result.success).toBe(true);
      expect(revalidatePath).toHaveBeenCalledWith("/modules/mod-1");
    });
  });

  describe("removeMember (additional branches)", () => {
    it("should fail if requester is not owner or admin", async () => {
      prismaMock.moduleMember.findUnique.mockResolvedValue({ role: ModuleRole.MEMBER } as any);
      const result = await removeMember("mod-1", "target-user");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/only owners and admins/i);
    });

    it("should fail if requester is null", async () => {
      prismaMock.moduleMember.findUnique.mockResolvedValue(null);
      const result = await removeMember("mod-1", "target-user");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/only owners and admins/i);
    });

    it("should fail if target member is not found", async () => {
      prismaMock.moduleMember.findUnique
        .mockResolvedValueOnce({ role: ModuleRole.OWNER } as any)
        .mockResolvedValueOnce(null);
      const result = await removeMember("mod-1", "target-user");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/member not found/i);
    });

    it("should fail if target is the owner", async () => {
      prismaMock.moduleMember.findUnique
        .mockResolvedValueOnce({ role: ModuleRole.OWNER } as any)
        .mockResolvedValueOnce({ role: ModuleRole.OWNER } as any);
      const result = await removeMember("mod-1", "target-user");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/cannot remove the owner/i);
    });
  });
    

    /**
     * Creates the module, generates a PIN, and assigns the OWNER role.
     */
    it("should create a module and assign the creator as OWNER", async () => {
      const fd = makeFormData({ name: "Physics", description: "Hard class", maxMembers: "50" });
      (generateUniquePin as jest.Mock).mockResolvedValue("ABC123");
      
      prismaMock.module.create.mockResolvedValue({ id: "mod-1" } as any);

      const result = await createModule(fd);

      expect(result.success).toBe(true);
      expect(result.joinPin).toBe("ABC123");
      expect(prismaMock.moduleMember.create).toHaveBeenCalledWith({
        data: { moduleId: "mod-1", userId: mockUserId, role: ModuleRole.OWNER },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/modules");
    });
  });

  describe("joinModule", () => {
    /**
     * Validates PIN format requirements (exactly 6 characters).
     */
    it("should fail if PIN is not exactly 6 characters", async () => {
      const result = await joinModule("SHORT");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/invalid pin format/i);
    });

    /**
     * Rejects attempts to join a full module.
     */
    it("should fail if the module is full", async () => {
      prismaMock.module.findUnique.mockResolvedValue({
        id: "mod-1", maxMembers: 10, _count: { members: 10 }
      } as any);

      const result = await joinModule("ABC123");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/module is full/i);
    });

    /**
     * Joins the module, creates a MEMBER role, and syncs historical data.
     */
    it("should join the module and trigger sync tasks/events", async () => {
      prismaMock.module.findUnique.mockResolvedValue({
        id: "mod-1", maxMembers: 50, _count: { members: 5 }
      } as any);
      prismaMock.moduleMember.findUnique.mockResolvedValue(null);

      const result = await joinModule("ABC123");

      expect(result.success).toBe(true);
      expect(prismaMock.moduleMember.create).toHaveBeenCalledWith({
        data: { moduleId: "mod-1", userId: mockUserId, role: ModuleRole.MEMBER }
      });
      expect(syncEventsToMember).toHaveBeenCalledWith("mod-1", mockUserId);
      expect(syncTasksToMember).toHaveBeenCalledWith("mod-1", mockUserId);
    });
  });

  describe("leaveModule", () => {
    /**
     * Ensures an Owner cannot leave their own module, preventing orphaned modules.
     */
    it("should block the OWNER from leaving", async () => {
      prismaMock.moduleMember.findUnique.mockResolvedValue({ role: ModuleRole.OWNER } as any);
      const result = await leaveModule("mod-1");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/owners cannot leave/i);
    });

    /**
     * Verifies that a standard member can leave, and their personal copies
     * of module tasks/events are purged.
     */
    it("should delete the membership and purge user data", async () => {
      prismaMock.moduleMember.findUnique.mockResolvedValue({ role: ModuleRole.MEMBER } as any);
      
      const result = await leaveModule("mod-1");

      expect(result.success).toBe(true);
      expect(prismaMock.moduleMember.delete).toHaveBeenCalled();
      expect(prismaMock.event.deleteMany).toHaveBeenCalled();
      expect(prismaMock.task.deleteMany).toHaveBeenCalled();
    });
  });

  describe("removeMember", () => {
    /**
     * Verifies the permission hierarchy: Admins cannot remove other Admins.
     */
    it("should prevent an ADMIN from removing another ADMIN", async () => {
      prismaMock.moduleMember.findUnique
        .mockResolvedValueOnce({ role: ModuleRole.ADMIN } as any) // Requester
        .mockResolvedValueOnce({ role: ModuleRole.ADMIN } as any); // Target

      const result = await removeMember("mod-1", "target-user");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/admins cannot remove other admins/i);
    });

    /**
     * Ensures Owners can remove members, and the target's data is purged.
     */
    it("should successfully remove a target member and clean up their data", async () => {
      prismaMock.moduleMember.findUnique
        .mockResolvedValueOnce({ role: ModuleRole.OWNER } as any) 
        .mockResolvedValueOnce({ role: ModuleRole.MEMBER } as any); 

      const result = await removeMember("mod-1", "target-user");

      expect(result.success).toBe(true);
      expect(prismaMock.moduleMember.delete).toHaveBeenCalledWith({
        where: { moduleId_userId: { moduleId: "mod-1", userId: "target-user" } }
      });
      expect(prismaMock.task.deleteMany).toHaveBeenCalled();
    });
  });
});