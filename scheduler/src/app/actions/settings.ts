'use server'

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { hashPassword, verifyPassword } from "@/lib/password"; // Adjust import if needed

export async function updateAccountDetails(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const username = formData.get("username") as string;
  const email = formData.get("email") as string;

  if (!username || !email) throw new Error("Username and email are required");

  // Check for existing username/email collisions
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username: username },
        { email: email }
      ],
      NOT: { id: session.user.id }
    }
  });

  if (existingUser) {
    if (existingUser.username === username) throw new Error("Username already taken");
    if (existingUser.email === email) throw new Error("Email already in use");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { username, email }
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

  if (newPassword !== confirmPassword) {
    throw new Error("New passwords do not match");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true }
  });

  // If user has a password, verify the current one
  if (user?.passwordHash) {
    if (!currentPassword) throw new Error("Current password is required");
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) throw new Error("Incorrect current password");
  }

  // Hash and save new password
  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newHash }
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function disconnectGoogle() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Ensure they have a password before disconnecting Google, so they aren't locked out!
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true }
  });

  if (!user?.passwordHash) {
    throw new Error("You must set a password before disconnecting your Google account.");
  }

  await prisma.account.deleteMany({
    where: {
      userId: session.user.id,
      provider: "google"
    }
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function updatePreferences(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Extract and format data from the form
  const workStartTime = formData.get("workStartTime") as string || "09:00";
  const workEndTime = formData.get("workEndTime") as string || "17:00";
  const sessionLength = parseInt(formData.get("sessionLength") as string) || 60;
  const breakLength = parseInt(formData.get("breakLength") as string) || 15;
  const breaksPerDay = parseInt(formData.get("breaksPerDay") as string) || 3;
  const maxTasksPerDay = parseInt(formData.get("maxTasksPerDay") as string) || 10;
  const defaultTaskDuration = parseInt(formData.get("defaultTaskDuration") as string) || 30;
  const reminderDays = parseInt(formData.get("reminderDays") as string) || 1;
  const taskOrder = formData.get("taskOrder") as string || "priority";
  
  // Get all checked days off
  const daysOff = formData.getAll("daysOff") as string[];

  // Use upsert: Update if they exist, create if they don't!
  await prisma.userPreferences.upsert({
    where: { userId: session.user.id },
    update: {
      workStartTime, workEndTime, sessionLength, breakLength, breaksPerDay,
      maxTasksPerDay, defaultTaskDuration, reminderDays, taskOrder, daysOff
    },
    create: {
      userId: session.user.id,
      workStartTime, workEndTime, sessionLength, breakLength, breaksPerDay,
      maxTasksPerDay, defaultTaskDuration, reminderDays, taskOrder, daysOff
    }
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function deleteAccount(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true }
  });

  if (!user || !user.passwordHash) throw new Error("User not found or invalid account state.");

  // 1. Always demand and verify the password
  const password = formData.get("password") as string;
  if (!password) throw new Error("Password is required to delete your account.");
  
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) throw new Error("Incorrect password.");

  // 2. Delete the user
  await prisma.userPreferences.deleteMany({ where: { userId: session.user.id } });
  
  await prisma.user.delete({
    where: { id: session.user.id }
  });

  return { success: true };
}