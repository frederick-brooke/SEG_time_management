/**
 * Testing for groups/events actions
 */

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { createGroupEvent, updateGroupEvent, deleteGroupEvent, getGroupEvents } from "../events";
import { requireSession, isGroupMember, generateGroupId } from "../utils";

// Mocks

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

// Tests

describe("Group Events Actions", () => {
  const mockUserId = "user-123";

  beforeEach(() => {
    jest.clearAllMocks();
    (requireSession as jest.Mock).mockResolvedValue({ user: { id: mockUserId } });
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: mockUserId } });
  });
  afterAll(async () => {
    await new Promise(process.nextTick); 
  });
  describe("createGroupEvent", () => {
    /**
     * Verifies that users cannot create events in groups they don't belong to.
     */
    it("should fail if the user is not a group member", async () => {
      (isGroupMember as jest.Mock).mockResolvedValue(false);
      const result = await createGroupEvent("group-1", { title: "Test" });
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/not a member/i);
    });

    /**
     * Verifies it handles empty groups gracefully without attempting DB inserts.
     */
    it("should fail if the group has no members", async () => {
      (isGroupMember as jest.Mock).mockResolvedValue(true);
      prismaMock.groupMember.findMany.mockResolvedValue([]);
      
      const result = await createGroupEvent("group-1", { title: "Test" });
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/no members/i);
    });

    /**
     * Ensures an event is duplicated for every member in the group
     * so it shows up on their personal calendars, tagged with the shared groupEventGroupId.
     */
    it("should create an event copy for every member in the group", async () => {
      (isGroupMember as jest.Mock).mockResolvedValue(true);
      (generateGroupId as jest.Mock).mockReturnValue("shared-event-id");
      prismaMock.groupMember.findMany.mockResolvedValue([
        { userId: "user-1" }, { userId: "user-2" }
      ] as any);

      const result = await createGroupEvent("group-1", {
        title: "Study",
        start: "2026-01-01T10:00:00Z",
        end: "2026-01-01T11:00:00Z",
      });

      expect(result.success).toBe(true);
      expect(prismaMock.event.create).toHaveBeenCalledTimes(2);
      expect(prismaMock.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: "user-1", groupEventGroupId: "shared-event-id" })
        })
      );
      expect(revalidatePath).toHaveBeenCalledWith("/groups/group-1");
    });
    // Confirms event creation fails if the group has no members.
    it("should return an error if the group has no members", async () => {
      (isGroupMember as jest.Mock).mockResolvedValue(true);
      prismaMock.groupMember.findMany.mockResolvedValue([]);
      
      const result = await createGroupEvent("group-1", { title: "Test" });
      expect(result.success).toBe(false);
    });
  });

  describe("updateGroupEvent", () => {
    /**
     * Ensures only valid group members can update shared events.
     */
    it("should fail if the user is not a member", async () => {
      (isGroupMember as jest.Mock).mockResolvedValue(false);
      const result = await updateGroupEvent("shared-event-id", "group-1", {});
      expect(result.success).toBe(false);
    });

    /**
     * Uses `updateMany` to apply the edits to every user's copy of the event.
     */
    it("should update all member copies of the event", async () => {
      (isGroupMember as jest.Mock).mockResolvedValue(true);
      
      const result = await updateGroupEvent("shared-event-id", "group-1", {
        title: "New Title",
        start: "2026-01-01T10:00:00Z",
        end: "2026-01-01T11:00:00Z",
      });

      expect(result.success).toBe(true);
      expect(prismaMock.event.updateMany).toHaveBeenCalledWith({
        where: { groupEventGroupId: "shared-event-id", groupId: "group-1", isGroupEvent: true },
        data: expect.objectContaining({ title: "New Title" })
      });
    });
  });

  describe("deleteGroupEvent", () => {
    /**
     * Verifies that deleting a group event strips it from all members' calendars.
     */
    it("should delete all member copies of the event", async () => {
      (isGroupMember as jest.Mock).mockResolvedValue(true);
      
      const result = await deleteGroupEvent("shared-event-id", "group-1");

      expect(result.success).toBe(true);
      expect(prismaMock.event.deleteMany).toHaveBeenCalledWith({
        where: { groupEventGroupId: "shared-event-id", groupId: "group-1", isGroupEvent: true },
      });
    });
  });
  describe("getGroupEvents", () => {
    // Confirms it safely returns an empty array if the user is unauthenticated.
    it("should return empty array if no session", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const result = await getGroupEvents("group-1");
      expect(result).toEqual([]);
    });

    // Confirms it fetches the user's localized group events.
    it("should return the events for the authenticated user", async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "user-123" } });
      prismaMock.event.findMany.mockResolvedValue([{ id: "e1", title: "Meeting" }] as any);
      
      const result = await getGroupEvents("group-1");
      expect(result).toHaveLength(1);
    });
  });
});