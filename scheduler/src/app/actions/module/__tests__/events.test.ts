/**
 * Testing for module/events actions.
 */

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { DeepMockProxy } from "jest-mock-extended";
import {
  createModuleEvent,
  updateModuleEvent,
  deleteModuleEvent,
  getModuleEvents,
} from "../events";
import { requireSession, isModuleOwnerOrAdmin, generateGroupId } from "../utils";

jest.mock("@/lib/prisma", () => {
  const { mockDeep } = require("jest-mock-extended");
  return { prisma: mockDeep() };
});
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("../utils", () => ({
  requireSession: jest.fn(),
  isModuleOwnerOrAdmin: jest.fn(),
  generateGroupId: jest.fn(),
}));

const prismaMock = prisma as unknown as DeepMockProxy<typeof prisma>;

describe("Module Events Actions", () => {
  const mockUserId = "user-123";

  beforeEach(() => {
    jest.clearAllMocks();
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: mockUserId } });
  });

  describe("createModuleEvent", () => {
    /**
     * Validates permission matrix: standard members cannot create global events.
     */
    it("should fail if the user is not an owner or admin", async () => {
      (isModuleOwnerOrAdmin as jest.Mock).mockResolvedValue(false);
      const result = await createModuleEvent("mod-1", { title: "Exam" });
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/only module owners or admins/i);
    });

    /**
     * Duplicates the event for all members in the module, and explicitly
     * ensures the creator gets a copy even if they aren't technically returned
     * in the member fetch (safeguard for empty modules).
     */
    it("should create an event copy for everyone and force creator inclusion", async () => {
      (isModuleOwnerOrAdmin as jest.Mock).mockResolvedValue(true);
      (generateGroupId as jest.Mock).mockReturnValue("shared-event");
      prismaMock.moduleMember.findMany.mockResolvedValue([{ userId: "student-1" }] as any);

      const result = await createModuleEvent("mod-1", {
        title: "Lecture",
        start: "2026-01-01T10:00:00Z",
        end: "2026-01-01T11:00:00Z",
      });

      expect(result.success).toBe(true);
      expect(prismaMock.event.create).toHaveBeenCalledTimes(2); // 1 student + 1 creator
      expect(revalidatePath).toHaveBeenCalledWith("/modules/mod-1");
    });

    /**
     * Verifies creator is not duplicated when they are already in the members list.
     */
    it("should not duplicate the creator if already in the members list", async () => {
      (isModuleOwnerOrAdmin as jest.Mock).mockResolvedValue(true);
      (generateGroupId as jest.Mock).mockReturnValue("shared-event");
      prismaMock.moduleMember.findMany.mockResolvedValue([{ userId: mockUserId }] as any);

      const result = await createModuleEvent("mod-1", {
        title: "Lecture",
        start: "2026-01-01T10:00:00Z",
        end: "2026-01-01T11:00:00Z",
      });

      expect(result.success).toBe(true);
      expect(prismaMock.event.create).toHaveBeenCalledTimes(1); // creator already included
    });

    /**
     * Verifies the default category "Lecture" is applied when no category is provided.
     */
    it("should default category to Lecture when not provided", async () => {
      (isModuleOwnerOrAdmin as jest.Mock).mockResolvedValue(true);
      (generateGroupId as jest.Mock).mockReturnValue("shared-event");
      prismaMock.moduleMember.findMany.mockResolvedValue([{ userId: mockUserId }] as any);

      await createModuleEvent("mod-1", {
        title: "Lecture",
        start: "2026-01-01T10:00:00Z",
        end: "2026-01-01T11:00:00Z",
      });

      expect(prismaMock.event.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ category: "Lecture" }) })
      );
    });
  });

  describe("updateModuleEvent", () => {
    /**
     * Validates permission matrix for updating global events.
     */
    it("should fail if the user lacks admin rights", async () => {
      (isModuleOwnerOrAdmin as jest.Mock).mockResolvedValue(false);
      const result = await updateModuleEvent("shared-event", "mod-1", {});
      expect(result.success).toBe(false);
    });

    /**
     * Ensures updateMany is called to cascade changes across all student copies.
     */
    it("should update all member copies of the event", async () => {
      (isModuleOwnerOrAdmin as jest.Mock).mockResolvedValue(true);
      const result = await updateModuleEvent("shared-event", "mod-1", { title: "New Title" });
      expect(result.success).toBe(true);
      expect(prismaMock.event.updateMany).toHaveBeenCalledWith({
        where: { moduleEventGroupId: "shared-event", moduleId: "mod-1", isModuleEvent: true },
        data: expect.objectContaining({ title: "New Title" }),
      });
    });

    /**
     * Verifies the default category "Lecture" is applied when not provided on update.
     */
    it("should default category to Lecture when not provided on update", async () => {
      (isModuleOwnerOrAdmin as jest.Mock).mockResolvedValue(true);
      await updateModuleEvent("shared-event", "mod-1", { title: "New Title" });
      expect(prismaMock.event.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ category: "Lecture" }),
        })
      );
    });
  });

  describe("deleteModuleEvent", () => {
    /**
     * Validates permission matrix: standard members cannot delete global events.
     */
    it("should fail if the user lacks admin rights", async () => {
      (isModuleOwnerOrAdmin as jest.Mock).mockResolvedValue(false);
      const result = await deleteModuleEvent("shared-event", "mod-1");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/only module owners or admins/i);
    });

    /**
     * Deletes all member copies of the event by group ID.
     */
    it("should delete all member copies and revalidate the path", async () => {
      (isModuleOwnerOrAdmin as jest.Mock).mockResolvedValue(true);
      const result = await deleteModuleEvent("shared-event", "mod-1");
      expect(result.success).toBe(true);
      expect(prismaMock.event.deleteMany).toHaveBeenCalledWith({
        where: { moduleEventGroupId: "shared-event", moduleId: "mod-1", isModuleEvent: true },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/modules/mod-1");
    });
  });

  describe("getModuleEvents", () => {
    /**
     * Returns an empty array when there is no active session.
     */
    it("should return empty array if no session", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const result = await getModuleEvents("mod-1");
      expect(result).toEqual([]);
    });

    /**
     * Returns the current user's module events ordered by start date.
     */
    it("should return the user's module events", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: { id: mockUserId } });
      prismaMock.event.findMany.mockResolvedValue([
        { id: "ev-1", title: "Lecture", start: new Date(), end: new Date() },
      ] as any);

      const result = await getModuleEvents("mod-1");
      expect(prismaMock.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { moduleId: "mod-1", isModuleEvent: true, userId: mockUserId },
        })
      );
      expect(result).toHaveLength(1);
    });
  });
});