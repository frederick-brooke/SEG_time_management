import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { createModuleEvent, updateModuleEvent, deleteModuleEvent } from "../events";
import { requireSession, isModuleOwnerOrAdmin, generateGroupId } from "../utils";

//mocks
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

//tests
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
     * Happy Path: Duplicates the event for all members in the module, and explicitly
     * ensures the creator gets a copy even if they aren't technically returned
     * in the member fetch (safeguard for empty modules).
     */
    it("should create an event copy for everyone and force creator inclusion", async () => {
      (isModuleOwnerOrAdmin as jest.Mock).mockResolvedValue(true);
      (generateGroupId as jest.Mock).mockReturnValue("shared-event");
      prismaMock.moduleMember.findMany.mockResolvedValue([{ userId: "student-1" }] as any);

      const result = await createModuleEvent("mod-1", {
        title: "Lecture", start: "2026-01-01T10:00:00Z", end: "2026-01-01T11:00:00Z"
      });

      expect(result.success).toBe(true);
      expect(prismaMock.event.create).toHaveBeenCalledTimes(2); // 1 student + 1 creator
      expect(revalidatePath).toHaveBeenCalledWith("/modules/mod-1");
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
        data: expect.objectContaining({ title: "New Title" })
      });
    });
  });
});