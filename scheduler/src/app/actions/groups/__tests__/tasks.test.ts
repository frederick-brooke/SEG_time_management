import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { createGroupTask, getGroupTasksWithProgress, toggleGroupTaskComplete } from "../tasks";
import { requireSession, isGroupMember, generateGroupId } from "../utils";

//mocks
jest.mock("@/lib/prisma", () => {
  const { mockDeep } = require("jest-mock-extended");
  return { prisma: mockDeep() };
});
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("../utils", () => ({
  requireSession: jest.fn(),
  isGroupMember: jest.fn(),
  generateGroupId: jest.fn(),
}));

const prismaMock = prisma as unknown as DeepMockProxy<typeof prisma>;

//tests
describe("Group Tasks Actions", () => {
  const mockUserId = "user-123";

  beforeEach(() => {
    jest.clearAllMocks();
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: mockUserId } });
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: mockUserId } });
  });

  describe("createGroupTask", () => {
    /**
     * Happy path: Ensures tasks are duplicated for all group members so each
     * user gets their own personal completion toggle.
     */
    it("should create a task copy for every member in the group", async () => {
      (isGroupMember as jest.Mock).mockResolvedValue(true);
      (generateGroupId as jest.Mock).mockReturnValue("shared-task-id");
      prismaMock.groupMember.findMany.mockResolvedValue([
        { userId: "user-1" }, { userId: "user-2" }
      ] as any);

      const result = await createGroupTask("group-1", { title: "Read Chapter 1" });

      expect(result.success).toBe(true);
      expect(prismaMock.task.create).toHaveBeenCalledTimes(2);
      expect(prismaMock.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: "user-1", groupTaskGroupId: "shared-task-id" })
        })
      );
    });
  });

  describe("getGroupTasksWithProgress", () => {
    /**
     * Verifies the complex deduplication logic. It should group the individual member
     * tasks back together and sort users into 'completed' and 'inProgress' arrays.
     */
    it("should deduplicate tasks and aggregate member progress", async () => {
      // Setup: 2 users, same task. One finished it, one hasn't.
      prismaMock.task.findMany.mockResolvedValue([
        {
          id: "t1", groupTaskGroupId: "shared-task", title: "Read", completed: true, userId: "user-1",
          user: { id: "user-1", fname: "Alice" }
        },
        {
          id: "t2", groupTaskGroupId: "shared-task", title: "Read", completed: false, userId: mockUserId,
          user: { id: mockUserId, fname: "Bob" }
        }
      ] as any);

      const result = await getGroupTasksWithProgress("group-1");

      expect(result).toHaveLength(1); // Deduplicated to 1 master task
      const aggregatedTask = result[0];
      expect(aggregatedTask.totalAssigned).toBe(2);
      expect(aggregatedTask.currentUserCompleted).toBe(false); // Bob hasn't finished
      expect(aggregatedTask.completedMembers).toHaveLength(1); // Alice
      expect(aggregatedTask.inProgressMembers).toHaveLength(1); // Bob
    });
  });

  describe("toggleGroupTaskComplete", () => {
    /**
     * Verifies that toggling completion only updates the specific user's copy
     * of the task, leaving other group members' copies untouched.
     */
    it("should only update the completion status for the current user's task copy", async () => {
      await toggleGroupTaskComplete("shared-task-id", "group-1", true);

      expect(prismaMock.task.updateMany).toHaveBeenCalledWith({
        where: {
          groupTaskGroupId: "shared-task-id",
          groupId: "group-1",
          isGroupTask: true,
          userId: mockUserId, // CRITICAL: Scoped to current user only
        },
        data: expect.objectContaining({ completed: true, status: "completed" })
      });
    });
  });
});