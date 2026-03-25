import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { 
  createGroupTask, 
  getGroupTasksWithProgress, 
  toggleGroupTaskComplete, 
  updateGroupTask, 
  deleteGroupTask, 
  getGroupTasks 
} from "../tasks";
import { requireSession, isGroupMember, generateGroupId } from "../utils";

// mocks
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

// tests
describe("Group Tasks Actions", () => {
  const mockUserId = "user-123";

  beforeEach(() => {
    jest.clearAllMocks();
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: mockUserId } });
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: mockUserId } });
  });

  afterAll(async () => {
    // Wait a tick for any pending Prisma promises to resolve to prevent Open Handles
    await new Promise(process.nextTick); 
  });

  describe("createGroupTask", () => {
    // Confirms tasks are duplicated for all group members so each user gets their own completion toggle.
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
    // Confirms task creation fails if the group has no members.
    it("should return an error if the group has no members", async () => {
      (isGroupMember as jest.Mock).mockResolvedValue(true);
      prismaMock.groupMember.findMany.mockResolvedValue([]);
      
      const result = await createGroupTask("group-1", { title: "Test" });
      
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/no members/i);
    });
  });

  describe("getGroupTasksWithProgress", () => {
    // Confirms the deduplication logic groups individual member tasks and sorts users by completion status.
    it("should deduplicate tasks and aggregate member progress", async () => {
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

      expect(result).toHaveLength(1);
      const aggregatedTask = result[0];
      expect(aggregatedTask.totalAssigned).toBe(2);
      expect(aggregatedTask.currentUserCompleted).toBe(false); 
      expect(aggregatedTask.completedMembers).toHaveLength(1); 
      expect(aggregatedTask.inProgressMembers).toHaveLength(1); 
    });
  });

  describe("toggleGroupTaskComplete", () => {
    // Confirms that toggling completion only updates the specific user's copy of the task.
    it("should only update the completion status for the current user's task copy", async () => {
      await toggleGroupTaskComplete("shared-task-id", "group-1", true);

      expect(prismaMock.task.updateMany).toHaveBeenCalledWith({
        where: {
          groupTaskGroupId: "shared-task-id",
          groupId: "group-1",
          isGroupTask: true,
          userId: mockUserId, 
        },
        data: expect.objectContaining({ completed: true, status: "completed" })
      });
    });
  });

  describe("updateGroupTask", () => {
    // Confirms only valid group members can update shared tasks.
    it("should fail if the user is not a member", async () => {
      (isGroupMember as jest.Mock).mockResolvedValue(false);
      const result = await updateGroupTask("shared-task-id", "group-1", {});
      expect(result.success).toBe(false);
    });

    // Confirms updating a task applies the edits to all member copies.
    it("should update all member copies of the task", async () => {
      (isGroupMember as jest.Mock).mockResolvedValue(true);
      const result = await updateGroupTask("shared-task-id", "group-1", { title: "New Title" });
      expect(result.success).toBe(true);
      expect(prismaMock.task.updateMany).toHaveBeenCalled();
    });
  });

  describe("deleteGroupTask", () => {
    // Confirms only valid group members can delete tasks.
    it("should fail if the user is not a member", async () => {
      (isGroupMember as jest.Mock).mockResolvedValue(false);
      const result = await deleteGroupTask("shared-task-id", "group-1");
      expect(result.success).toBe(false);
    });

    // Confirms deleting a task wipes it from all members' calendars.
    it("should delete all member copies of the task", async () => {
      (isGroupMember as jest.Mock).mockResolvedValue(true);
      const result = await deleteGroupTask("shared-task-id", "group-1");
      expect(result.success).toBe(true);
      expect(prismaMock.task.deleteMany).toHaveBeenCalled();
    });
  });

  describe("getGroupTasks", () => {
    // Confirms the function safely returns an empty array if no session exists.
    it("should return empty array if unauthenticated", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const result = await getGroupTasks("group-1");
      expect(result).toEqual([]);
    });

    // Confirms the function returns the specific user's tasks for the given group.
    it("should return the user's tasks", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "user-1" } });
      prismaMock.task.findMany.mockResolvedValue([{ id: "t1", title: "Test" }] as any);
      const result = await getGroupTasks("group-1");
      expect(result).toHaveLength(1);
    });
  });
});