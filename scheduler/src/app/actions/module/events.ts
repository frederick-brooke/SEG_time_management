'use server';

import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { revalidatePath } from "next/cache";
import { requireSession, isModuleOwner, generateGroupId } from "./utils";

//module events

/**
 * Creates an event on every module member's calendar, grouped by a shared groupId
 * @param {string} moduleId - The module database ID
 * @param {object} eventData - Event fields (title, start, end, category, etc.)
 * @return {Promise<{ success: boolean; message?: string; error?: string }>}
 */
export async function createModuleEvent(moduleId: string, eventData: any) {
  const session = await requireSession();

  if (!(await isModuleOwner(moduleId, session.user.id))) {
    return { success: false, error: "Only module owners can create module events" };
  }
  
  const module = await prisma.module.findUnique({ where: { id: moduleId }, select: { name: true } });
  if (!module) return { success: false, error: "Module not found" };
  
  const members = await prisma.moduleMember.findMany({
    where: { moduleId },
    select: { userId: true },
  });

  if (members.length === 0) return { success: false, error: "No members in module" };

  const moduleEventGroupId = generateGroupId();

  await Promise.all(
    members.map((member) =>
      prisma.event.create({
        data: {
          userId: member.userId,
          moduleId,
          isModuleEvent: true,
          moduleEventGroupId,
          title: eventData.title,
          description: eventData.description || null,
          start: new Date(eventData.start),
          end: new Date(eventData.end),
          allDay: eventData.allDay || false,
          category: eventData.category || "Lecture",
          startCoords: eventData.startCoords || null,
          destinationCoords: eventData.destinationCoords || null,
          travelDuration: eventData.travelDuration || null,
          startLocationName: eventData.startLocationName || null,
          destLocationName: eventData.destLocationName || null,
          transportMode: eventData.transportMode || null,
          recurrence: eventData.recurrence || null,
        },
      })
    )
  );

  revalidatePath(`/modules/${moduleId}`);
  return { success: true, message: `Event created for ${members.length} members` };
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

  if (!(await isModuleOwner(moduleId, session.user.id))) {
    return { success: false, error: "Only module owners can edit module events" };
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

  if (!(await isModuleOwner(moduleId, session.user.id))) {
    return { success: false, error: "Only module owners can delete module events" };
  }

  await prisma.event.deleteMany({
    where: { moduleEventGroupId, moduleId, isModuleEvent: true },
  });

  revalidatePath(`/modules/${moduleId}`);
  return { success: true };
}

/**
 * Gets deduplicated upcoming events for a module, one per group
 * @param {string} moduleId - The module database ID
 * @return {Promise<Array>} - List of upcoming module events
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
    take: 20,
  });
}