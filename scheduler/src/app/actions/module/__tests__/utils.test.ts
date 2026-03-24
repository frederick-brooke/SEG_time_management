import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { ModuleRole } from "@prisma/client";
import { 
  requireSession, 
  generateUniquePin, 
  isModuleOwnerOrAdmin, 
  syncEventsToMember 
} from "../utils";

//mocks
jest.mock("@/lib/prisma", () => {
  const { mockDeep } = require("jest-mock-extended");
  return { prisma: mockDeep() };
});
jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));

const prismaMock = prisma as unknown as DeepMockProxy<typeof prisma>;

//tests
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
  });

  describe("generateUniquePin", () => {
    /**
     * Checks the collision retry logic. It should retry generating a PIN if the
     * first one already exists in the database.
     */
    it("should retry if the generated PIN already exists in the database", async () => {
      prismaMock.module.findUnique
        .mockResolvedValueOnce({ id: "existing" } as any) // 1st try: collision
        .mockResolvedValueOnce(null); // 2nd try: unique

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

  describe("isModuleOwnerOrAdmin", () => {
    /**
     * Verifies the hybrid permission check used for creating tasks and events.
     */
    it("should return true for an OWNER", async () => {
      prismaMock.moduleMember.findUnique.mockResolvedValue({ role: ModuleRole.OWNER } as any);
      const isPrivileged = await isModuleOwnerOrAdmin("mod-1", "user");
      expect(isPrivileged).toBe(true);
    });

    it("should return true for an ADMIN", async () => {
      prismaMock.moduleMember.findUnique.mockResolvedValue({ role: ModuleRole.ADMIN } as any);
      const isPrivileged = await isModuleOwnerOrAdmin("mod-1", "user");
      expect(isPrivileged).toBe(true);
    });

    it("should return false for a regular MEMBER", async () => {
      prismaMock.moduleMember.findUnique.mockResolvedValue({ role: ModuleRole.MEMBER } as any);
      const isPrivileged = await isModuleOwnerOrAdmin("mod-1", "user");
      expect(isPrivileged).toBe(false);
    });
  });

  describe("syncEventsToMember", () => {
    /**
     * Verifies that when a student joins late, the system finds all distinct 
     * shared events from the module and creates fresh copies for the new student.
     */
    it("should fetch distinct events and duplicate them for the new member", async () => {
      prismaMock.event.findMany.mockResolvedValue([
        { moduleEventGroupId: "shared-1", title: "Midterm" }
      ] as any);

      await syncEventsToMember("mod-1", "new-user");

      expect(prismaMock.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ distinct: ["moduleEventGroupId"] })
      );
      expect(prismaMock.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: "new-user", title: "Midterm" })
        })
      );
    });
  });
});