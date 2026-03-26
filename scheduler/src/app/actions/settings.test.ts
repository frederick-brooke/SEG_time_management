import {
    updateAccountDetails,
    changePassword,
    disconnectGoogle,
    updatePreferences,
    deleteAccount,
  } from "@/app/actions/settings";
  
  import { getServerSession } from "next-auth";
  import { prisma } from "@/lib/prisma";
  import { revalidatePath } from "next/cache";
  import { hashPassword, verifyPassword } from "@/lib/password";
  
  
  jest.mock("next-auth", () => ({
    getServerSession: jest.fn(),
  }));
  
  jest.mock("@/lib/prisma", () => ({
    prisma: {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      account: {
        deleteMany: jest.fn(),
      },
      userPreferences: {
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      friendRequest: { deleteMany: jest.fn() },
      notification: { deleteMany: jest.fn() },
      userInventory: { deleteMany: jest.fn() },
      userProgress: { deleteMany: jest.fn(), findUnique: jest.fn() },
      pointTransaction: { deleteMany: jest.fn() },
      task: { deleteMany: jest.fn() },
      exam: { deleteMany: jest.fn() },
      event: { deleteMany: jest.fn() },
      category: { deleteMany: jest.fn() },
      checkIn: { deleteMany: jest.fn() },
      scheduleLog: { deleteMany: jest.fn() },
      savedLocation: { deleteMany: jest.fn() },
      conversationParticipant: { deleteMany: jest.fn() },
      moduleMember: { deleteMany: jest.fn() },
      groupMember: { deleteMany: jest.fn() },
    },
  }));
  
  jest.mock("next/cache", () => ({
    revalidatePath: jest.fn(),
  }));
  
  jest.mock("@/lib/password", () => ({
    hashPassword: jest.fn(),
    verifyPassword: jest.fn(),
  }));
  
  const mockSession = {
    user: { id: "user-1", email: "test@test.com" },
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  
  describe("updateAccountDetails", () => {
    it("updates user successfully", async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
  
      (prisma.user.update as jest.Mock).mockResolvedValue({});
  
      const formData = new FormData();
      formData.set("username", "newname");
      formData.set("email", "new@email.com");
  
      const res = await updateAccountDetails(formData);
  
      expect(res).toEqual({ success: true });
      expect(prisma.user.update).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/settings");
    });
  
    it("throws if username/email missing", async () => {
      const formData = new FormData();
  
      await expect(updateAccountDetails(formData)).rejects.toThrow();
    });
  });
  
  
  describe("changePassword", () => {
    it("changes password successfully", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        passwordHash: "oldhash",
      });
  
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      (hashPassword as jest.Mock).mockResolvedValue("newhash");
      (prisma.user.update as jest.Mock).mockResolvedValue({});
  
      const formData = new FormData();
      formData.set("currentPassword", "old");
      formData.set("newPassword", "newpass");
      formData.set("confirmPassword", "newpass");
  
      const res = await changePassword(formData);
  
      expect(res).toEqual({ success: true });
    });
  
    it("throws if passwords do not match", async () => {
      const formData = new FormData();
      formData.set("newPassword", "a");
      formData.set("confirmPassword", "b");
  
      await expect(changePassword(formData)).rejects.toThrow();
    });
  });
  
  
  describe("disconnectGoogle", () => {
    it("disconnects google account", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        passwordHash: "hash",
      });
  
      (prisma.account.deleteMany as jest.Mock).mockResolvedValue({});
  
      const res = await disconnectGoogle();
  
      expect(res).toEqual({ success: true });
      expect(prisma.account.deleteMany).toHaveBeenCalled();
    });
  
    it("throws if no password set", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        passwordHash: null,
      });
  
      await expect(disconnectGoogle()).rejects.toThrow();
    });
  });
  
  
  describe("updatePreferences", () => {
    it("upserts preferences", async () => {
      (prisma.userPreferences.upsert as jest.Mock).mockResolvedValue({});
  
      const formData = new FormData();
      formData.set("sessionLength", "45");
  
      const res = await updatePreferences(formData);
  
      expect(res).toEqual({ success: true });
      expect(prisma.userPreferences.upsert).toHaveBeenCalled();
    });
  });
  
  
  describe("deleteAccount", () => {
    it("deletes full account flow", async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        passwordHash: "hash",
      });
  
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      (prisma.userProgress.findUnique as jest.Mock).mockResolvedValue({
        id: "progress-1",
      });
  
      (prisma.pointTransaction.deleteMany as jest.Mock).mockResolvedValue({});
      (prisma.user.delete as jest.Mock).mockResolvedValue({});
  
      const formData = new FormData();
      formData.set("password", "123");
  
      const res = await deleteAccount(formData);
  
      expect(res).toEqual({ success: true });
      expect(prisma.user.delete).toHaveBeenCalled();
    });
  });