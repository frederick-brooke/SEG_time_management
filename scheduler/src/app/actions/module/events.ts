'use server';

/**
 * Module event service
 *
 * Handles creating, updating, deleting, and fetching events within a module.
 * Syncs events across all members using a shared moduleEventGroupId.
 */

import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { revalidatePath } from "next/cache";
import { requireSession, isModuleOwnerOrAdmin, generateGroupId } from "./utils";

//section module events

/**
 * Creates an event on every module member's calendar, grouped by a shared groupId.
 * Ensures the creator always gets a copy even if the module is empty.
 * @param {string} moduleId - The module database ID
 * @param {object} eventData - Event fields (title, start, end, category, etc.)
 * @return {Promise<{ success: boolean; message?: string; error?: string }>}
 */
export async function createModuleEvent(moduleId: string, eventData: any) {
  const session = await requireSession();

  // Both Owners and Admins can create events
  if (!(await isModuleOwnerOrAdmin(moduleId, session.user.id))) {
    return { success: false, error: "Only module owners or admins can create events" };
  }

  const members = await prisma.moduleMember.findMany({
    where: { moduleId },
    select: { userId: true },
  });

  const moduleEventGroupId = generateGroupId();

  // Get all users in the module (Owners, Admins, and Members all need to see events)
  const memberIdsToAssign = members.map((m) => m.userId);

  // Force the creator to get a copy so the event saves to the database
  // even if there are no students in the module yet.
  if (!memberIdsToAssign.includes(session.user.id)) {
    memberIdsToAssign.push(session.user.id);
  }

  await Promise.all(
    memberIdsToAssign.map((userId) =>
      prisma.event.create({
        data: {
          userId,
          moduleId,
          isModuleEvent: true,
          moduleEventGroupId,
          title: eventData.title,
          description: eventData.description || null,
          start: new Date(eventData.start),
          end: new Date(eventData.end),
          category: eventData.category || "Lecture",
        },
      })
    )
  );

  revalidatePath(`/modules/${moduleId}`);
  return { success: true, message: `Event created successfully` };
}

/**
 * Updates all member copies of a module event by group ID
 * @param {string} moduleEventGroupId - The shared group ID for the event
 * @param {string} moduleId - The module database ID
 * @param {object} eventData - Updated event fields
 * @return {Promise<{ success: boolean; error?: string }>}
 */
export async function updateModuleEvent(
  moduleEventGroupId: string,
  moduleId: string,
  eventData: any
) {
  const session = await requireSession();

  if (!(await isModuleOwnerOrAdmin(moduleId, session.user.id))) {
    return { success: false, error: "Only module owners or admins can edit events" };
  }

  await prisma.event.updateMany({
    where: { moduleEventGroupId, moduleId, isModuleEvent: true },
    data: {
      title: eventData.title,
      description: eventData.description || null,
      start: new Date(eventData.start),
      end: new Date(eventData.end),
      category: eventData.category || "Lecture",
    },
  });

  revalidatePath(`/modules/${moduleId}`);
  return { success: true };
}

/**
 * Deletes all member copies of a module event by group ID
 * @param {string} moduleEventGroupId - The shared group ID for the event
 * @param {string} moduleId - The module database ID
 * @return {Promise<{ success: boolean; error?: string }>}
 */
export async function deleteModuleEvent(moduleEventGroupId: string, moduleId: string) {
  const session = await requireSession();

  if (!(await isModuleOwnerOrAdmin(moduleId, session.user.id))) {
    return { success: false, error: "Only module owners or admins can delete events" };
  }

  await prisma.event.deleteMany({
    where: { moduleEventGroupId, moduleId, isModuleEvent: true },
  });

  revalidatePath(`/modules/${moduleId}`);
  return { success: true };
}

/**
 * Gets the current user's module events to display on the module detail page
 * @param {string} moduleId - The module database ID
 * @return {Promise<Array>} - List of the current user's module events
 */
export async function getModuleEvents(moduleId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  
  return prisma.event.findMany({
    where: { moduleId, isModuleEvent: true, userId: session.user.id },
    select: {
      id: true,
      moduleEventGroupId: true,
      title: true,
      description: true,
      start: true,
      end: true,
      category: true,
    },
    orderBy: { start: 'asc' },
  });
}