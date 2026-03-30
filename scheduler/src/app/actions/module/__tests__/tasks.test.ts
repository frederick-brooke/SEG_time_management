/**
 * Testing for module/tasks actions.
 */

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import {
  createModuleTask,
  updateModuleTask,
  deleteModuleTask,
  getModuleTasks,
  getModuleTasksWithProgress,
} from "../tasks";
import { requireSession, isModuleOwner, generateGroupId } from "../utils";

jest.mock("@/lib/prisma", () => {
  const { mockDeep } = require("jest-mock-extended");
  return { prisma: mockDeep() };
});
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("../utils", () => ({
  requireSession: jest.fn(),
  isModuleOwner: jest.fn(),
  generateGroupId: jest.fn(),
}));

const prismaMock = prisma as unknown as DeepMockProxy<typeof prisma>;

describe("Module Tasks Actions", () => {
  const mockUserId = "user-123";

  beforeEach(() => {
    jest.clearAllMocks();
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: mockUserId } });
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: mockUserId } });
  });

  describe("createModuleTask", () => {
    /**
     * Validates permission matrix: only module owners can create module tasks.
     */
    it("should fail if the user is not the module owner", async () => {
      (isModuleOwner as jest.Mock).mockResolvedValue(false);
      const result = await createModuleTask("mod-1", { title: "Homework 1" });
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/only module owners/i);
    });

    /**
     * Verifies that when a task is created, it skips filtering for 'ADMIN/OWNER'
     * but explicitly assigns it to 'MEMBER' users, plus forces a template copy for the creator.
     */
    it("should assign tasks to standard members and force a creator template copy", async () => {
      (isModuleOwner as jest.Mock).mockResolvedValue(true);
      (generateGroupId as jest.Mock).mockReturnValue("shared-task");
      prismaMock.moduleMember.findMany.mockResolvedValue([
        { userId: "student-1", role: "MEMBER" },
        { userId: "admin-1", role: "ADMIN" },
      ] as any);

      const result = await createModuleTask("mod-1", { title: "Homework 1" });

      expect(result.success).toBe(true);
      expect(prismaMock.task.create).toHaveBeenCalledTimes(2);
      expect(revalidatePath).toHaveBeenCalledWith("/modules/mod-1");
    });

    /**
     * Verifies creator is not duplicated when they are already in the members list as a MEMBER.
     */
    it("should not duplicate the creator if already in the members list", async () => {
      (isModuleOwner as jest.Mock).mockResolvedValue(true);
      (generateGroupId as jest.Mock).mockReturnValue("shared-task");
      prismaMock.moduleMember.findMany.mockResolvedValue([
        { userId: mockUserId, role: "MEMBER" },
      ] as any);

      const result = await createModuleTask("mod-1", { title: "Homework 1" });

      expect(result.success).toBe(true);
      expect(prismaMock.task.create).toHaveBeenCalledTimes(1);
    });

    /**
     * Verifies optional fields default correctly when not provided in taskData.
     */
    it("should apply default values for optional fields", async () => {
      (isModuleOwner as jest.Mock).mockResolvedValue(true);
      (generateGroupId as jest.Mock).mockReturnValue("shared-task");
      prismaMock.moduleMember.findMany.mockResolvedValue([
        { userId: mockUserId, role: "MEMBER" },
      ] as any);

      await createModuleTask("mod-1", { title: "Homework 1" });

      expect(prismaMock.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priority: "Low",
            duration: 0,
            status: "todo",
            completed: false,
          }),
        })
      );
    });
  });

  describe("updateModuleTask", () => {
    /**
     * Validates permission matrix: only module owners can edit module tasks.
     */
    it("should fail if the user is not the module owner", async () => {
      (isModuleOwner as jest.Mock).mockResolvedValue(false);
      const result = await updateModuleTask("shared-task", "mod-1", { title: "Updated" });
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/only module owners/i);
    });

    /**
     * Ensures updateMany is called to cascade changes across all member copies.
     */
    it("should update all member copies of the task", async () => {
      (isModuleOwner as jest.Mock).mockResolvedValue(true);
      const result = await updateModuleTask("shared-task", "mod-1", {
        title: "Updated Title",
        priority: "High",
        duration: 60,
      });

      expect(result.success).toBe(true);
      expect(prismaMock.task.updateMany).toHaveBeenCalledWith({
        where: { moduleTaskGroupId: "shared-task", moduleId: "mod-1", isModuleTask: true },
        data: expect.objectContaining({ title: "Updated Title", priority: "High" }),
      });
      expect(revalidatePath).toHaveBeenCalledWith("/modules/mod-1");
    });

    /**
     * Verifies optional fields default correctly when not provided on update.
     */
    it("should apply default priority and duration when not provided", async () => {
      (isModuleOwner as jest.Mock).mockResolvedValue(true);
      await updateModuleTask("shared-task", "mod-1", { title: "Updated" });

      expect(prismaMock.task.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ priority: "Low", duration: 0 }),
        })
      );
    });
  });

  describe("deleteModuleTask", () => {
    /**
     * Validates permission matrix: only module owners can delete module tasks.
     */
    it("should fail if the user is not the module owner", async () => {
      (isModuleOwner as jest.Mock).mockResolvedValue(false);
      const result = await deleteModuleTask("shared-task", "mod-1");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/only module owners/i);
    });

    /**
     * Deletes all member copies of the task by group ID and revalidates the path.
     */
    it("should delete all member copies and revalidate the path", async () => {
      (isModuleOwner as jest.Mock).mockResolvedValue(true);
      const result = await deleteModuleTask("shared-task", "mod-1");

      expect(result.success).toBe(true);
      expect(prismaMock.task.deleteMany).toHaveBeenCalledWith({
        where: { moduleTaskGroupId: "shared-task", moduleId: "mod-1", isModuleTask: true },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/modules/mod-1");
    });
  });

  describe("getModuleTasks", () => {
    /**
     * Returns an empty array when there is no active session.
     */
    it("should return empty array if no session", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const result = await getModuleTasks("mod-1");
      expect(result).toEqual([]);
    });

    /**
     * Returns the current user's module tasks ordered by completion and due date.
     */
    it("should return the user's module tasks", async () => {
      prismaMock.task.findMany.mockResolvedValue([
        { id: "task-1", title: "Homework", completed: false },
      ] as any);

      const result = await getModuleTasks("mod-1");

      expect(prismaMock.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { moduleId: "mod-1", isModuleTask: true, userId: mockUserId },
        })
      );
      expect(result).toHaveLength(1);
    });
  });

  describe("getModuleTasksWithProgress", () => {
    /**
     * Returns an empty array when there is no active session.
     */
    it("should return empty array if no session", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const result = await getModuleTasksWithProgress("mod-1");
      expect(result).toEqual([]);
    });

    /**
     * Ensures that when calculating completion stats,
     * the Owner and Admin template tasks are ignored so they don't artificially skew
     * the "In Progress" counts for actual students.
     */
    it("should deduplicate tasks and ONLY aggregate progress for standard members", async () => {
      prismaMock.task.findMany.mockResolvedValue([
        {
          id: "task-1",
          moduleTaskGroupId: "group-1",
          userId: "student-1",
          completed: true,
          title: "Homework",
          description: null,
          dueDate: null,
          priority: "Low",
          duration: 0,
          url: null,
          user: { id: "student-1", username: "stu", fname: "S", lname: "T", pfp: null },
        },
        {
          id: "task-2",
          moduleTaskGroupId: "group-1",
          userId: mockUserId,
          completed: false,
          title: "Homework",
          description: null,
          dueDate: null,
          priority: "Low",
          duration: 0,
          url: null,
          user: { id: mockUserId, username: "owner", fname: "O", lname: "W", pfp: null },
        },
      ] as any);

      prismaMock.moduleMember.findMany.mockResolvedValue([
        { userId: "student-1", role: "MEMBER" },
        { userId: mockUserId, role: "OWNER" },
      ] as any);

      const result = await getModuleTasksWithProgress("mod-1");

      expect(result).toHaveLength(1);
      const aggregatedTask = result[0];
      expect(aggregatedTask.totalAssigned).toBe(1);
      expect(aggregatedTask.completedMembers).toHaveLength(1);
      expect(aggregatedTask.inProgressMembers).toHaveLength(0);
    });

    /**
     * Verifies that incomplete MEMBER tasks are correctly placed in the inProgressMembers list.
     */
    it("should add incomplete member tasks to inProgressMembers", async () => {
      prismaMock.task.findMany.mockResolvedValue([
        {
          id: "task-1",
          moduleTaskGroupId: "group-1",
          userId: "student-1",
          completed: false,
          title: "Homework",
          description: null,
          dueDate: null,
          priority: "Low",
          duration: 0,
          url: null,
          user: { id: "student-1", username: "stu", fname: "S", lname: "T", pfp: null },
        },
      ] as any);

      prismaMock.moduleMember.findMany.mockResolvedValue([
        { userId: "student-1", role: "MEMBER" },
      ] as any);

      const result = await getModuleTasksWithProgress("mod-1");

      expect(result[0].inProgressMembers).toHaveLength(1);
      expect(result[0].completedMembers).toHaveLength(0);
      expect(result[0].totalAssigned).toBe(1);
    });
  });
});