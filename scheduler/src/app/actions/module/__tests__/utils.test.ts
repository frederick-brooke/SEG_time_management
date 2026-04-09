/**
 * Testing for module/utils actions.
 */

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { DeepMockProxy } from "jest-mock-extended";
import { ModuleRole } from "@prisma/client";
import {
  requireSession,
  generatePin,
  generateUniquePin,
  generateGroupId,
  isModuleOwner,
  isModuleOwnerOrAdmin,
  syncEventsToMember,
  syncTasksToMember,
} from "../utils";

jest.mock("@/lib/prisma", () => {
  const { mockDeep } = require("jest-mock-extended");
  return { prisma: mockDeep() };
});
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));

const prismaMock = prisma as unknown as DeepMockProxy<typeof prisma>;

describe("Module Utils", () => {
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

    /**
     * Returns the session object when the user is authenticated.
     */
    it("should return the session if the user is authenticated", async () => {
      const mockSession = { user: { id: "user-123" } };
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      const session = await requireSession();
      expect(session).toEqual(mockSession);
    });
  });

  describe("generatePin", () => {
    /**
     * Verifies that the PIN generator produces exactly 6 uppercase alphanumeric characters.
     */
    it("should return a 6-character alphanumeric string", () => {
      const pin = generatePin();
      expect(pin).toHaveLength(6);
      expect(pin).toMatch(/^[A-Z0-9]{6}$/);
    });

    /**
     * Verifies that consecutive calls produce different PINs (non-deterministic).
     */
    it("should produce different PINs on consecutive calls", () => {
      const pins = new Set(Array.from({ length: 20 }, () => generatePin()));
      expect(pins.size).toBeGreaterThan(1);
    });
  });

  describe("generateUniquePin", () => {
    /**
     * Checks the collision retry logic. It should retry generating a PIN if the
     * first one already exists in the database.
     */
    it("should retry if the generated PIN already exists in the database", async () => {
      prismaMock.module.findUnique
        .mockResolvedValueOnce({ id: "existing" } as any)
        .mockResolvedValueOnce(null);
      const pin = await generateUniquePin();
      expect(pin).toHaveLength(6);
      expect(prismaMock.module.findUnique).toHaveBeenCalledTimes(2);
    });

    /**
     * Ensures the function breaks cleanly after 10 failed attempts rather than
     * entering an infinite while-loop.
     */
    it("should throw an error if it fails 10 times", async () => {
      prismaMock.module.findUnique.mockResolvedValue({ id: "existing" } as any);
      await expect(generateUniquePin()).rejects.toThrow(/after 10 attempts/i);
      expect(prismaMock.module.findUnique).toHaveBeenCalledTimes(10);
    });
  });

  describe("generateGroupId", () => {
    /**
     * Verifies that the group ID is a 24-character hex string.
     */
    it("should return a 24-character hex string", () => {
      const id = generateGroupId();
      expect(id).toHaveLength(24);
      expect(id).toMatch(/^[a-f0-9]{24}$/);
    });

    /**
     * Verifies that consecutive calls produce unique group IDs.
     */
    it("should produce unique IDs on consecutive calls", () => {
      const ids = new Set(Array.from({ length: 10 }, () => generateGroupId()));
      expect(ids.size).toBe(10);
    });
  });

  describe("isModuleOwner", () => {
    /**
     * Verifies that the ownership check returns true for an OWNER role.
     */
    it("should return true if the user is the module OWNER", async () => {
      prismaMock.moduleMember.findUnique.mockResolvedValue({ role: ModuleRole.OWNER } as any);
      const result = await isModuleOwner("mod-1", "user-123");
      expect(result).toBe(true);
    });

    /**
     * Verifies that non-owners are correctly rejected.
     */
    it("should return false if the user is not the module OWNER", async () => {
      prismaMock.moduleMember.findUnique.mockResolvedValue({ role: ModuleRole.MEMBER } as any);
      const result = await isModuleOwner("mod-1", "user-123");
      expect(result).toBe(false);
    });

    /**
     * Verifies that a missing membership record returns false safely.
     */
    it("should return false if no membership record exists", async () => {
      prismaMock.moduleMember.findUnique.mockResolvedValue(null);
      const result = await isModuleOwner("mod-1", "user-123");
      expect(result).toBe(false);
    });
  });

  describe("isModuleOwnerOrAdmin", () => {
    /**
     * Verifies the hybrid permission check used for creating tasks and events.
     */
    it("should return true for an OWNER", async () => {
      prismaMock.moduleMember.findUnique.mockResolvedValue({ role: ModuleRole.OWNER } as any);
      expect(await isModuleOwnerOrAdmin("mod-1", "user")).toBe(true);
    });

    it("should return true for an ADMIN", async () => {
      prismaMock.moduleMember.findUnique.mockResolvedValue({ role: ModuleRole.ADMIN } as any);
      expect(await isModuleOwnerOrAdmin("mod-1", "user")).toBe(true);
    });

    it("should return false for a regular MEMBER", async () => {
      prismaMock.moduleMember.findUnique.mockResolvedValue({ role: ModuleRole.MEMBER } as any);
      expect(await isModuleOwnerOrAdmin("mod-1", "user")).toBe(false);
    });

    /**
     * Verifies that a missing membership record returns false safely.
     */
    it("should return false if no membership record exists", async () => {
      prismaMock.moduleMember.findUnique.mockResolvedValue(null);
      expect(await isModuleOwnerOrAdmin("mod-1", "user")).toBe(false);
    });
  });

  describe("syncEventsToMember", () => {
    /**
     * Verifies that when a student joins late, the system finds all distinct
     * shared events from the module and creates fresh copies for the new student.
     */
    it("should fetch distinct events and duplicate them for the new member", async () => {
      prismaMock.event.findMany.mockResolvedValue([
        { moduleEventGroupId: "shared-1", title: "Midterm" },
      ] as any);

      await syncEventsToMember("mod-1", "new-user");

      expect(prismaMock.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ distinct: ["moduleEventGroupId"] })
      );
      expect(prismaMock.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: "new-user", title: "Midterm" }),
        })
      );
    });

    /**
     * Verifies that no create calls are made when the module has no existing events.
     */
    it("should not create any events if none exist in the module", async () => {
      prismaMock.event.findMany.mockResolvedValue([]);
      await syncEventsToMember("mod-1", "new-user");
      expect(prismaMock.event.create).not.toHaveBeenCalled();
    });
  });

  describe("syncTasksToMember", () => {
    /**
     * Verifies that when a student joins late, the system finds all distinct
     * shared tasks from the module and creates fresh copies for the new student.
     */
    it("should fetch distinct tasks and duplicate them for the new member", async () => {
      prismaMock.task.findMany.mockResolvedValue([
        { moduleTaskGroupId: "task-group-1", title: "Assignment 1" },
      ] as any);

      await syncTasksToMember("mod-1", "new-user");

      expect(prismaMock.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ distinct: ["moduleTaskGroupId"] })
      );
      expect(prismaMock.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "new-user",
            title: "Assignment 1",
            status: "todo",
            completed: false,
          }),
        })
      );
    });

    /**
     * Verifies that no create calls are made when the module has no existing tasks.
     */
    it("should not create any tasks if none exist in the module", async () => {
      prismaMock.task.findMany.mockResolvedValue([]);
      await syncTasksToMember("mod-1", "new-user");
      expect(prismaMock.task.create).not.toHaveBeenCalled();
    });
  });
});