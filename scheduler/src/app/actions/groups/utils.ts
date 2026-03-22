import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { GroupRole } from "@prisma/client";
import { randomBytes } from "crypto";

//types

export const MEMBER_USER_SELECT = {
  id: true,
  username: true,
  fname: true,
  lname: true,
  pfp: true,
} as const;

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
 * Verifies the current user is the OWNER of the given group
 * @param {string} groupId - The group database ID to check
 * @param {string} userId - The user ID to verify ownership for
 * @return {Promise<boolean>} - True if user is owner, false otherwise
 */
export async function isGroupOwner(groupId: string, userId: string): Promise<boolean> {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return membership?.role === GroupRole.OWNER;
}

/**
 * Verifies the current user is a member of the given group
 * @param {string} groupId - The group database ID to check
 * @param {string} userId - The user ID to verify membership for
 * @return {Promise<boolean>} - True if user is a member, false otherwise
 */
export async function isGroupMember(groupId: string, userId: string): Promise<boolean> {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return !!membership;
}

/**
 * Generates a random hex string to use as a shared group ID for tasks/events
 * @return {string} - 24-character hex group ID
 */
export function generateGroupId(): string {
  return randomBytes(12).toString("hex");
}

/**
 * Fetches the current user's accepted friends for use in the create group form
 * @param {string} userId - The current user's ID
 * @return {Promise<Array>} - List of friend user objects
 */
export async function fetchFriendsForUser(userId: string) {
  const [sent, received] = await Promise.all([
    prisma.friendRequest.findMany({
      where: { senderId: userId, status: "ACCEPTED" },
      select: { receiver: { select: MEMBER_USER_SELECT } },
    }),
    prisma.friendRequest.findMany({
      where: { receiverId: userId, status: "ACCEPTED" },
      select: { sender: { select: MEMBER_USER_SELECT } },
    }),
  ]);
  return [...sent.map((r) => r.receiver), ...received.map((r) => r.sender)];
}

//sync helpers

/**
 * Copies all existing group events to a newly added member's calendar
 * @param {string} groupId - The group database ID
 * @param {string} userId - The new member's user ID
 * @return {Promise<void>}
 */
export async function syncEventsToMember(groupId: string, userId: string): Promise<void> {
  const existingEvents = await prisma.event.findMany({
    where: { groupId, isGroupEvent: true },
    distinct: ["groupEventGroupId"],
    select: {
      groupEventGroupId: true, title: true, description: true,
      start: true, end: true, allDay: true, category: true,
      startCoords: true, destinationCoords: true, travelDuration: true,
      startLocationName: true, destLocationName: true,
      transportMode: true, recurrence: true,
    },
  });

  await Promise.all(
    existingEvents.map((event) =>
      prisma.event.create({ data: { userId, groupId, isGroupEvent: true, ...event } })
    )
  );
}

/**
 * Copies all existing group tasks to a newly added member's task list
 * @param {string} groupId - The group database ID
 * @param {string} userId - The new member's user ID
 * @return {Promise<void>}
 */
export async function syncTasksToMember(groupId: string, userId: string): Promise<void> {
  const existingTasks = await prisma.task.findMany({
    where: { groupId, isGroupTask: true },
    distinct: ["groupTaskGroupId"],
    select: {
      groupTaskGroupId: true, title: true, description: true,
      dueDate: true, priority: true, duration: true, subtasks: true, url: true,
    },
  });

  await Promise.all(
    existingTasks.map((task) =>
      prisma.task.create({
        data: { userId, groupId, isGroupTask: true, status: "todo", completed: false, ...task },
      })
    )
  );
}