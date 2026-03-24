'use server'

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function updateAccountDetails(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const username = formData.get("username") as string;
  const email = formData.get("email") as string;

  if (!username || !email) throw new Error("Username and email are required");

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
      NOT: { id: session.user.id },
    },
  });

  if (existingUser) {
    if (existingUser.username === username) throw new Error("Username already taken");
    if (existingUser.email === email) throw new Error("Email already in use");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { username, email },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function changePassword(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (newPassword !== confirmPassword) throw new Error("New passwords do not match");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (user?.passwordHash) {
    if (!currentPassword) throw new Error("Current password is required");
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) throw new Error("Incorrect current password");
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newHash },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function disconnectGoogle() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    throw new Error("You must set a password before disconnecting your Google account.");
  }

  await prisma.account.deleteMany({
    where: { userId: session.user.id, provider: "google" },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function updatePreferences(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const workStartTime = (formData.get("workStartTime") as string) || "09:00";
  const workEndTime = (formData.get("workEndTime") as string) || "17:00";
  const sessionLength = parseInt(formData.get("sessionLength") as string) || 60;
  const breakLength = parseInt(formData.get("breakLength") as string) || 15;
  const breaksPerDay = parseInt(formData.get("breaksPerDay") as string) || 3;
  const maxTasksPerDay = parseInt(formData.get("maxTasksPerDay") as string) || 10;
  const defaultTaskDuration = parseInt(formData.get("defaultTaskDuration") as string) || 30;
  const reminderDays = parseInt(formData.get("reminderDays") as string) || 1;
  const taskOrder = (formData.get("taskOrder") as string) || "priority";
  const daysOff = formData.getAll("daysOff") as string[];

  const preferencesData = {
    workStartTime,
    workEndTime,
    sessionLength,
    breakLength,
    breaksPerDay,
    maxTasksPerDay,
    defaultTaskDuration,
    reminderDays,
    taskOrder,
    daysOff,
  };

  await prisma.userPreferences.upsert({
    where: { userId: session.user.id },
    update: preferencesData,
    create: { userId: session.user.id, ...preferencesData },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function deleteAccount(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) throw new Error("User not found or invalid account state.");

  const password = formData.get("password") as string;
  if (!password) throw new Error("Password is required to delete your account.");

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) throw new Error("Incorrect password.");

  const userId = session.user.id;

  // Step 1: fetch progress ID before deleting anything
  const progress = await prisma.userProgress.findUnique({
    where: { userId },
    select: { id: true },
  });

  // Step 2: delete PointTransactions first (child of UserProgress)
  if (progress) {
    await prisma.pointTransaction.deleteMany({
      where: { progressId: progress.id },
    });
  }

  // Step 3: delete all other relations before deleting the user
  await prisma.friendRequest.deleteMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
  });
  await prisma.notification.deleteMany({ where: { userId } });
  await prisma.userPreferences.deleteMany({ where: { userId } });
  await prisma.userInventory.deleteMany({ where: { userId } });
  await prisma.userProgress.deleteMany({ where: { userId } });
  await prisma.task.deleteMany({ where: { userId } });
  await prisma.exam.deleteMany({ where: { userId } });
  await prisma.event.deleteMany({ where: { userId } });
  await prisma.category.deleteMany({ where: { userId } });
  await prisma.checkIn.deleteMany({ where: { userId } });
  await prisma.scheduleLog.deleteMany({ where: { userId } });
  await prisma.savedLocation.deleteMany({ where: { userId } });
  await prisma.conversationParticipant.deleteMany({ where: { userId } });
  await prisma.moduleMember.deleteMany({ where: { userId } });
  await prisma.groupMember.deleteMany({ where: { userId } });
  await prisma.account.deleteMany({ where: { userId } });

  // Step 4: delete the user last
  await prisma.user.delete({ where: { id: userId } });

  return { success: true };
}