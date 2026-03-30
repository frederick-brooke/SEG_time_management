'use server';

/**
 * Group event service
 *
 * Handles creating, updating, deleting, and fetching group events.
 * Keeps events in sync across all members using a shared groupEventGroupId.
 */

import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { revalidatePath } from "next/cache";
import { requireSession, isGroupMember, generateGroupId } from "./utils";

//group events

/**
 * Creates an event on every group member's calendar, grouped by a shared groupEventGroupId
 * Any member can create group events
 * @param {string} groupId - The group database ID
 * @param {object} eventData - Event fields (title, start, end, category, etc.)
 * @return {Promise<{ success: boolean; message?: string; error?: string }>}
 */
export async function createGroupEvent(groupId: string, eventData: any) {
  const session = await requireSession();

  if (!(await isGroupMember(groupId, session.user.id))) {
    return { success: false, error: "You are not a member of this group" };
  }

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });

  if (members.length === 0) return { success: false, error: "No members in group" };

  const groupEventGroupId = generateGroupId();

  await Promise.all(
    members.map((member) =>
      prisma.event.create({
        data: {
          userId: member.userId,
          groupId,
          isGroupEvent: true,
          groupEventGroupId,
          title: eventData.title,
          description: eventData.description || null,
          start: new Date(eventData.start),
          end: new Date(eventData.end),
          allDay: eventData.allDay || false,
          category: eventData.category || "Personal",
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

  revalidatePath(`/groups/${groupId}`);
  return { success: true, message: `Event created for ${members.length} members` };
}

/**
 * Updates all member copies of a group event by groupEventGroupId
 * Any member can update group events
 * @param {string} groupEventGroupId - The shared group ID for the event
 * @param {string} groupId - The group database ID
 * @param {object} eventData - Updated event fields
 * @return {Promise<{ success: boolean; error?: string }>}
 */
export async function updateGroupEvent(groupEventGroupId: string, groupId: string, eventData: any) {
  const session = await requireSession();

  if (!(await isGroupMember(groupId, session.user.id))) {
    return { success: false, error: "You are not a member of this group" };
  }

  await prisma.event.updateMany({
    where: { groupEventGroupId, groupId, isGroupEvent: true },
    data: {
      title: eventData.title,
      description: eventData.description || null,
      start: new Date(eventData.start),
      end: new Date(eventData.end),
      category: eventData.category || "Personal",
      destLocationName: eventData.destLocationName || null,
    },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * Deletes all member copies of a group event by groupEventGroupId
 * Any member can delete group events
 * @param {string} groupEventGroupId - The shared group ID for the event
 * @param {string} groupId - The group database ID
 * @return {Promise<{ success: boolean; error?: string }>}
 */
export async function deleteGroupEvent(groupEventGroupId: string, groupId: string) {
  const session = await requireSession();

  if (!(await isGroupMember(groupId, session.user.id))) {
    return { success: false, error: "You are not a member of this group" };
  }

  await prisma.event.deleteMany({
    where: { groupEventGroupId, groupId, isGroupEvent: true },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * Gets upcoming group events for the current user
 * @param {string} groupId - The group database ID
 * @return {Promise<Array>} - List of upcoming group events
 */
export async function getGroupEvents(groupId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  return prisma.event.findMany({
    where: { groupId, isGroupEvent: true, userId: session.user.id },
    orderBy: { start: "asc" },
    take: 20,
  });
}