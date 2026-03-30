'use server';

/**
 * Group service
 *
 * Handles group CRUD, membership, and settings.
 * Enforces roles (owner vs member) and keeps events/tasks in sync.
 */

import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { revalidatePath } from "next/cache";
import { GroupRole } from "@prisma/client";
import { 
  MEMBER_USER_SELECT, requireSession, isGroupOwner, 
  fetchFriendsForUser, syncEventsToMember, syncTasksToMember 
} from "./utils";

//group crud

/**
 * Creates a new group, adds the creator as OWNER, and adds selected friends as members
 * @param {string} name - Group name
 * @param {string | null} description - Optional group description
 * @param {string[]} memberIds - Array of friend user IDs to add to the group
 * @return {Promise<{ success: boolean; group?: object; error?: string }>}
 */
export async function createGroup(name: string, description: string | null, memberIds: string[]) {
  const session = await requireSession();

  if (!name?.trim()) return { success: false, error: "Group name is required" };
  if (memberIds.length === 0) return { success: false, error: "Add at least one friend to the group" };

  const group = await prisma.group.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      creatorId: session.user.id,
    },
  });

  const allMembers = [
    { groupId: group.id, userId: session.user.id, role: GroupRole.OWNER },
    ...memberIds.map((id) => ({ groupId: group.id, userId: id, role: GroupRole.MEMBER })),
  ];

  await prisma.groupMember.createMany({ data: allMembers });

  revalidatePath("/groups");
  return { success: true, group };
}

/**
 * Gets all groups the current user is a member of
 * @return {Promise<Array>} - List of groups with member count and user role
 */
export async function getMyGroups() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const memberships = await prisma.groupMember.findMany({
    where: { userId: session.user.id },
    include: {
      group: {
        include: {
          creator: { select: MEMBER_USER_SELECT },
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => ({
    ...m.group,
    memberCount: m.group._count.members,
    userRole: m.role,
  }));
}

/**
 * Gets full details for a specific group including members list
 * @param {string} groupId - The group database ID
 * @return {Promise<object | null>} - Group details or null if not found or not a member
 */
export async function getGroupDetails(groupId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      creator: { select: MEMBER_USER_SELECT },
      members: {
        include: { user: { select: MEMBER_USER_SELECT } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!group) return null;

  const userMembership = group.members.find((m) => m.userId === session.user.id);
  if (!userMembership) return null;

  return {
    ...group,
    userRole: userMembership.role,
    memberCount: group.members.length,
  };
}

/**
 * Gets the current user's friend list for use in the create/edit group member picker
 * @return {Promise<Array>} - List of friend user objects
 */
export async function getMyFriendsForGroup() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];
  return fetchFriendsForUser(session.user.id);
}

/**
 * Adds a friend to an existing group — owner only
 * @param {string} groupId - The group database ID
 * @param {string} userId - The user ID to add
 * @return {Promise<{ success: boolean; error?: string }>}
 */
export async function addGroupMember(groupId: string, userId: string) {
  const session = await requireSession();

  if (!(await isGroupOwner(groupId, session.user.id))) {
    return { success: false, error: "Only the group owner can add members" };
  }

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (existing) return { success: false, error: "User is already in this group" };

  await prisma.groupMember.create({
    data: { groupId, userId, role: GroupRole.MEMBER },
  });

  await Promise.all([
    syncEventsToMember(groupId, userId),
    syncTasksToMember(groupId, userId),
  ]);

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * Removes a member from a group — owner only, cannot remove themselves
 * Safely deletes their copies of group events and tasks to prevent data orphans.
 * @param {string} groupId - The group database ID
 * @param {string} userId - The user ID to remove
 * @return {Promise<{ success: boolean; error?: string }>}
 */
export async function removeGroupMember(groupId: string, userId: string) {
  const session = await requireSession();

  if (!(await isGroupOwner(groupId, session.user.id))) {
    return { success: false, error: "Only the group owner can remove members" };
  }

  if (userId === session.user.id) {
    return { success: false, error: "Owners cannot remove themselves — delete the group instead" };
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });

  await prisma.event.deleteMany({
    where: { groupId, userId: userId, isGroupEvent: true }
  });
  
  await prisma.task.deleteMany({
    where: { groupId, userId: userId, isGroupTask: true }
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * Removes the current user from a group — non-owners only
 * Safely deletes their copies of group events and tasks to prevent data orphans.
 * @param {string} groupId - The group database ID to leave
 * @return {Promise<{ success: boolean; error?: string }>}
 */
export async function leaveGroup(groupId: string) {
  const session = await requireSession();

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: session.user.id } },
  });

  if (!membership) return { success: false, error: "You are not a member of this group" };
  if (membership.role === GroupRole.OWNER) {
    return { success: false, error: "Group owners cannot leave — delete the group instead" };
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId: session.user.id } },
  });

  await prisma.event.deleteMany({
    where: { groupId, userId: session.user.id, isGroupEvent: true }
  });
  
  await prisma.task.deleteMany({
    where: { groupId, userId: session.user.id, isGroupTask: true }
  });

  revalidatePath("/groups");
  return { success: true };
}

/**
 * Permanently deletes a group and all its members — owner only
 * @param {string} groupId - The group database ID to delete
 * @return {Promise<{ success: boolean; error?: string }>}
 */
export async function deleteGroup(groupId: string) {
  const session = await requireSession();

  if (!(await isGroupOwner(groupId, session.user.id))) {
    return { success: false, error: "Only the group owner can delete the group" };
  }

  await prisma.group.delete({ where: { id: groupId } });

  revalidatePath("/groups");
  return { success: true };
}

//group settings

/**
 * Updates core group settings (Name and Description).
 * Only the group OWNER can perform this action.
 * @param {string} groupId - The ID of the group being updated.
 * @param {object} data - The updated name and description data.
 * @return {Promise<{ success: boolean; error?: string }>} - Status of the update request.
 */
export async function updateGroupSettings(groupId: string, data: { name: string; description: string | null }) {
  const session = await requireSession();

  if (!(await isGroupOwner(groupId, session.user.id))) {
    return { success: false, error: "Only group owners can edit settings" };
  }

  await prisma.group.update({
    where: { id: groupId },
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
    },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}