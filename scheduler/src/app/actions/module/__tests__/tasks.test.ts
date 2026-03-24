import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { createModuleTask, getModuleTasksWithProgress } from "../tasks";
import { requireSession, isModuleOwner, generateGroupId } from "../utils";

//mocks
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

//tests
describe("Module Tasks Actions", () => {
  const mockUserId = "user-123";

  beforeEach(() => {
    jest.clearAllMocks();
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: mockUserId } });
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: mockUserId } });
  });

  describe("createModuleTask", () => {
    /**
     * Verifies that when a task is created, it skips filtering for 'ADMIN/OWNER' 
     * but explicitly assigns it to 'MEMBER' users, plus forces a template copy for the creator.
     */
    it("should assign tasks to standard members and force a creator template copy", async () => {
      (isModuleOwner as jest.Mock).mockResolvedValue(true);
      (generateGroupId as jest.Mock).mockReturnValue("shared-task");
      
      prismaMock.moduleMember.findMany.mockResolvedValue([
        { userId: "student-1", role: "MEMBER" },
        { userId: "admin-1", role: "ADMIN" } // Admins don't get homework!
      ] as any);

      const result = await createModuleTask("mod-1", { title: "Homework 1" });

      expect(result.success).toBe(true);
      // It should create 2 tasks: 1 for the MEMBER, and 1 forced copy for the Creator
      expect(prismaMock.task.create).toHaveBeenCalledTimes(2);
    });
  });

  describe("getModuleTasksWithProgress", () => {
    /**
     * Very important logic test: It ensures that when calculating completion stats,
     * the Owner and Admin template tasks are IGNORED so they don't artificially skew
     * the "In Progress" counts for actual students.
     */
    it("should deduplicate tasks and ONLY aggregate progress for standard members", async () => {
      // Mock tasks belonging to a student and an owner
      prismaMock.task.findMany.mockResolvedValue([
        { groupTaskGroupId: "task-1", userId: "student-1", completed: true, user: { id: "student-1" } },
        { groupTaskGroupId: "task-1", userId: mockUserId, completed: false, user: { id: mockUserId } } // Owner copy
      ] as any);

      // Mock the roles so the logic knows who is who
      prismaMock.moduleMember.findMany.mockResolvedValue([
        { userId: "student-1", role: "MEMBER" },
        { userId: mockUserId, role: "OWNER" },
      ] as any);

      const result = await getModuleTasksWithProgress("mod-1");

      expect(result).toHaveLength(1);
      const aggregatedTask = result[0];
      
      // Total assigned should be 1 (only the student counts)
      expect(aggregatedTask.totalAssigned).toBe(1);
      expect(aggregatedTask.completedMembers).toHaveLength(1); // Student finished it
      
      // The Owner hasn't finished it, but they shouldn't show up in In Progress!
      expect(aggregatedTask.inProgressMembers).toHaveLength(0); 
    });
  });
});