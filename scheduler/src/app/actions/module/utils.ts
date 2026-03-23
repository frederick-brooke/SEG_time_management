import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { ModuleRole } from "@prisma/client";
import { randomBytes } from "crypto";

//helpers

/**
 * Retrieves the current session and throws if the user is not authenticated
 * @return {Promise<any>} - Authenticated session object
 * @throws {Error} - If no valid session exists
 */
export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session;
}

/**
 * Generates a random 6-character alphanumeric string
 * @return {string} - Candidate PIN string
 */
export function generatePin(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
}

/**
 * Generates a PIN that does not already exist in the database
 * @return {Promise<string>} - Unique join PIN
 * @throws {Error} - If a unique PIN cannot be generated within 10 attempts
 */
export async function generateUniquePin(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const pin = generatePin();
    const existing = await prisma.module.findUnique({ where: { joinPin: pin } });
    if (!existing) return pin;
  }
  throw new Error("Failed to generate unique PIN after 10 attempts");
}

/**
 * Generates a random hex string to use as a group ID for module tasks/events
 * @return {string} - 24-character hex group ID
 */
export function generateGroupId(): string {
  return randomBytes(12).toString('hex');
}

/**
 * Verifies the current user is an OWNER of the given module
 * @param {string} moduleId - The module database ID to check
 * @param {string} userId - The user ID to verify ownership for
 * @return {Promise<boolean>} - True if user is owner, false otherwise
 */
export async function isModuleOwner(moduleId: string, userId: string): Promise<boolean> {
  const membership = await prisma.moduleMember.findUnique({
    where: { moduleId_userId: { moduleId, userId } },
  });
  return membership?.role === ModuleRole.OWNER;
}

//sync helpers

/**
 * Copies all existing module events to a newly joined member's calendar
 * @param {string} moduleId - The module database ID
 * @param {string} userId - The new member's user ID
 * @return {Promise<void>}
 */
export async function syncEventsToMember(moduleId: string, userId: string): Promise<void> {
  const existingEvents = await prisma.event.findMany({
    where: { moduleId, isModuleEvent: true },
    distinct: ['moduleEventGroupId'],
    select: {
      moduleEventGroupId: true, title: true, description: true,
      start: true, end: true, allDay: true, category: true,
      startCoords: true, destinationCoords: true, travelDuration: true,
      startLocationName: true, destLocationName: true,
      transportMode: true, recurrence: true,
    },
  });

  await Promise.all(
    existingEvents.map((event) =>
      prisma.event.create({ data: { userId, moduleId, isModuleEvent: true, ...event } })
    )
  );
}

/**
 * Copies all existing module tasks to a newly joined member's task list
 * @param {string} moduleId - The module database ID
 * @param {string} userId - The new member's user ID
 * @return {Promise<void>}
 */
export async function syncTasksToMember(moduleId: string, userId: string): Promise<void> {
  const existingTasks = await prisma.task.findMany({
    where: { moduleId, isModuleTask: true },
    distinct: ['moduleTaskGroupId'],
    select: {
      moduleTaskGroupId: true, title: true, description: true,
      dueDate: true, priority: true, duration: true, subtasks: true, url: true,
    },
  });

  await Promise.all(
    existingTasks.map((task) =>
      prisma.task.create({
        data: { userId, moduleId, isModuleTask: true, status: "todo", completed: false, ...task },
      })
    )
  );
}

/**
 * Checks if the user has Owner or Admin privileges for a specific module.
 * @param {string} moduleId - The module database ID
 * @param {string} userId - The user database ID
 * @return {Promise<boolean>} True if the user is an OWNER or ADMIN.
 */
export async function isModuleOwnerOrAdmin(moduleId: string, userId: string): Promise<boolean> {
  const membership = await prisma.moduleMember.findUnique({
    where: {
      moduleId_userId: {
        moduleId,
        userId,
      },
    },
    select: { role: true },
  });

  return membership?.role === 'OWNER' || membership?.role === 'ADMIN';
}