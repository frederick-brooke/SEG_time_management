/**
 * Testing for actions/settings.
 */

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

// Mocks

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

// Tests

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

  it("throws if username is already taken", async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: "other-user",
      username: "newname",
      email: "other@email.com",
    });

    const formData = new FormData();
    formData.set("username", "newname");
    formData.set("email", "new@email.com");

    await expect(updateAccountDetails(formData)).rejects.toThrow("Username already taken");
  });

  it("throws if email is already in use", async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({
      id: "other-user",
      username: "differentname",
      email: "new@email.com",
    });

    const formData = new FormData();
    formData.set("username", "newname");
    formData.set("email", "new@email.com");

    await expect(updateAccountDetails(formData)).rejects.toThrow("Email already in use");
  });
});

describe("changePassword", () => {
  it("changes password successfully", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ passwordHash: "oldhash" });
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

  it("allows password change for OAuth user with no existing passwordHash", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ passwordHash: null });
    (hashPassword as jest.Mock).mockResolvedValue("newhash");
    (prisma.user.update as jest.Mock).mockResolvedValue({});

    const formData = new FormData();
    formData.set("newPassword", "newpass");
    formData.set("confirmPassword", "newpass");

    const res = await changePassword(formData);
    expect(res).toEqual({ success: true });
    expect(verifyPassword).not.toHaveBeenCalled();
  });

  it("throws if currentPassword is missing when user has a password", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ passwordHash: "oldhash" });

    const formData = new FormData();
    formData.set("newPassword", "newpass");
    formData.set("confirmPassword", "newpass");

    await expect(changePassword(formData)).rejects.toThrow("Current password is required");
  });

  it("throws if currentPassword is incorrect", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ passwordHash: "oldhash" });
    (verifyPassword as jest.Mock).mockResolvedValue(false);

    const formData = new FormData();
    formData.set("currentPassword", "wrongpass");
    formData.set("newPassword", "newpass");
    formData.set("confirmPassword", "newpass");

    await expect(changePassword(formData)).rejects.toThrow("Incorrect current password");
  });
});

describe("disconnectGoogle", () => {
  it("disconnects google account", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ passwordHash: "hash" });
    (prisma.account.deleteMany as jest.Mock).mockResolvedValue({});

    const res = await disconnectGoogle();

    expect(res).toEqual({ success: true });
    expect(prisma.account.deleteMany).toHaveBeenCalled();
  });

  it("throws if no password set", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ passwordHash: null });
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

  it("applies default values when form fields are empty", async () => {
    (prisma.userPreferences.upsert as jest.Mock).mockResolvedValue({});

    const res = await updatePreferences(new FormData());

    expect(res).toEqual({ success: true });
    expect(prisma.userPreferences.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          workStartTime: "09:00",
          workEndTime: "17:00",
          sessionLength: 60,
          breakLength: 15,
          breaksPerDay: 3,
          maxTasksPerDay: 10,
          defaultTaskDuration: 30,
          reminderDays: 1,
          taskOrder: "priority",
        }),
      })
    );
  });

  it("collects multiple daysOff values from form", async () => {
    (prisma.userPreferences.upsert as jest.Mock).mockResolvedValue({});

    const formData = new FormData();
    formData.append("daysOff", "Saturday");
    formData.append("daysOff", "Sunday");

    await updatePreferences(formData);

    expect(prisma.userPreferences.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          daysOff: ["Saturday", "Sunday"],
        }),
      })
    );
  });
});

describe("deleteAccount", () => {
  it("deletes full account flow", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ passwordHash: "hash" });
    (verifyPassword as jest.Mock).mockResolvedValue(true);
    (prisma.userProgress.findUnique as jest.Mock).mockResolvedValue({ id: "progress-1" });
    (prisma.pointTransaction.deleteMany as jest.Mock).mockResolvedValue({});
    (prisma.user.delete as jest.Mock).mockResolvedValue({});

    const formData = new FormData();
    formData.set("password", "123");

    const res = await deleteAccount(formData);

    expect(res).toEqual({ success: true });
    expect(prisma.user.delete).toHaveBeenCalled();
  });

  it("skips pointTransaction cleanup if no progress record exists", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ passwordHash: "hash" });
    (verifyPassword as jest.Mock).mockResolvedValue(true);
    (prisma.userProgress.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.delete as jest.Mock).mockResolvedValue({});

    const formData = new FormData();
    formData.set("password", "123");

    const res = await deleteAccount(formData);

    expect(res).toEqual({ success: true });
    expect(prisma.pointTransaction.deleteMany).not.toHaveBeenCalled();
    expect(prisma.user.delete).toHaveBeenCalled();
  });

  it("throws if password field is missing", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ passwordHash: "hash" });

    const formData = new FormData();

    await expect(deleteAccount(formData)).rejects.toThrow("Password is required");
  });

  it("throws if password is incorrect", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ passwordHash: "hash" });
    (verifyPassword as jest.Mock).mockResolvedValue(false);

    const formData = new FormData();
    formData.set("password", "wrongpassword");

    await expect(deleteAccount(formData)).rejects.toThrow("Incorrect password.");
  });
});