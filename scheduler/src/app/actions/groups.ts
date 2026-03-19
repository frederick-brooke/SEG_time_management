'use server';

import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { revalidatePath } from "next/cache";
import { GroupRole } from "@prisma/client";
import { randomBytes } from "crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

const MEMBER_USER_SELECT = {
  id: true,
  username: true,
  fname: true,
  lname: true,
  pfp: true,
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Retrieves the current session and throws if the user is not authenticated
 * @return {Promise<Session>} - Authenticated session object
 * @throws {Error} - If no valid session exists
 */
async function requireSession() {
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
async function isGroupOwner(groupId: string, userId: string): Promise<boolean> {
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
async function isGroupMember(groupId: string, userId: string): Promise<boolean> {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  return !!membership;
}

/**
 * Generates a random hex string to use as a shared group ID for tasks/events
 * @return {string} - 24-character hex group ID
 */
function generateGroupId(): string {
  return randomBytes(12).toString("hex");
}

/**
 * Fetches the current user's accepted friends for use in the create group form
 * @param {string} userId - The current user's ID
 * @return {Promise<Array>} - List of friend user objects
 */
async function fetchFriendsForUser(userId: string) {
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

// ─── Sync helpers ─────────────────────────────────────────────────────────────

/**
 * Copies all existing group events to a newly added member's calendar
 * @param {string} groupId - The group database ID
 * @param {string} userId - The new member's user ID
 * @return {Promise<void>}
 */
async function syncEventsToMember(groupId: string, userId: string): Promise<void> {
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
async function syncTasksToMember(groupId: string, userId: string): Promise<void> {
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

// ─── Group CRUD ───────────────────────────────────────────────────────────────

/**
 * Creates a new group, adds the creator as OWNER, and adds selected friends as members
 * @param {string} name - Group name
 * @param {string | null} description - Optional group description
 * @param {string[]} memberIds - Array of friend user IDs to add to the group
 * @return {Promise<{ success: boolean; group?: object; error?: string }>}
 */
export async function createGroup(
  name: string,
  description: string | null,
  memberIds: string[]
) {
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

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * Removes the current user from a group — non-owners only
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

// ─── Group events ─────────────────────────────────────────────────────────────

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
export async function updateGroupEvent(
  groupEventGroupId: string,
  groupId: string,
  eventData: any
) {
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

// ─── Group tasks ──────────────────────────────────────────────────────────────

/**
 * Creates a task on every group member's task list, grouped by a shared groupTaskGroupId
 * Any member can create group tasks
 * @param {string} groupId - The group database ID
 * @param {object} taskData - Task fields (title, dueDate, priority, etc.)
 * @return {Promise<{ success: boolean; message?: string; error?: string }>}
 */
export async function createGroupTask(groupId: string, taskData: any) {
  const session = await requireSession();

  if (!(await isGroupMember(groupId, session.user.id))) {
    return { success: false, error: "You are not a member of this group" };
  }

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });

  if (members.length === 0) return { success: false, error: "No members in group" };

  const groupTaskGroupId = generateGroupId();

  await Promise.all(
    members.map((member) =>
      prisma.task.create({
        data: {
          userId: member.userId,
          groupId,
          isGroupTask: true,
          groupTaskGroupId,
          title: taskData.title,
          description: taskData.description || null,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
          priority: taskData.priority || "Low",
          duration: taskData.duration || 0,
          subtasks: taskData.subtasks || [],
          url: taskData.url || null,
          status: "todo",
          completed: false,
        },
      })
    )
  );

  revalidatePath(`/groups/${groupId}`);
  return { success: true, message: `Task assigned to ${members.length} members` };
}

/**
 * Updates all member copies of a group task by groupTaskGroupId
 * Any member can update group tasks
 * @param {string} groupTaskGroupId - The shared group ID for the task
 * @param {string} groupId - The group database ID
 * @param {object} taskData - Updated task fields
 * @return {Promise<{ success: boolean; error?: string }>}
 */
export async function updateGroupTask(
  groupTaskGroupId: string,
  groupId: string,
  taskData: any
) {
  const session = await requireSession();

  if (!(await isGroupMember(groupId, session.user.id))) {
    return { success: false, error: "You are not a member of this group" };
  }

  await prisma.task.updateMany({
    where: { groupTaskGroupId, groupId, isGroupTask: true },
    data: {
      title: taskData.title,
      description: taskData.description || null,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      priority: taskData.priority || "Low",
      duration: taskData.duration || 0,
      url: taskData.url || null,
    },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * Deletes all member copies of a group task by groupTaskGroupId
 * Any member can delete group tasks
 * @param {string} groupTaskGroupId - The shared group ID for the task
 * @param {string} groupId - The group database ID
 * @return {Promise<{ success: boolean; error?: string }>}
 */
export async function deleteGroupTask(groupTaskGroupId: string, groupId: string) {
  const session = await requireSession();

  if (!(await isGroupMember(groupId, session.user.id))) {
    return { success: false, error: "You are not a member of this group" };
  }

  await prisma.task.deleteMany({
    where: { groupTaskGroupId, groupId, isGroupTask: true },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * Gets the current user's group tasks — used for the personal completion view
 * @param {string} groupId - The group database ID
 * @return {Promise<Array>} - List of the current user's group tasks
 */
export async function getGroupTasks(groupId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  return prisma.task.findMany({
    where: { groupId, isGroupTask: true, userId: session.user.id },
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }],
  });
}

/**
 * Gets deduplicated tasks with per-member completion progress
 * Returns one entry per task group with completed and in-progress member lists
 * @param {string} groupId - The group database ID
 * @return {Promise<Array>} - Task groups with progress data
 */
export async function getGroupTasksWithProgress(groupId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const allTasks = await prisma.task.findMany({
    where: { groupId, isGroupTask: true },
    include: {
      user: { select: { id: true, username: true, fname: true, lname: true , pfp: true} },
    },
    orderBy: { dueDate: "asc" },
  });

  const groupMap = new Map<string, {
    groupTaskGroupId: string;
    title: string;
    description: string | null;
    dueDate: Date | null;
    priority: string;
    duration: number;
    url: string | null;
    currentUserCompleted: boolean;
    completedMembers: { id: string; username: string; fname: string | null; lname: string | null; pfp: string | null }[];
    inProgressMembers: { id: string; username: string; fname: string | null; lname: string |null; pfp: string | null }[];
    totalAssigned: number;
  }>();

  for (const task of allTasks) {
    const id = task.groupTaskGroupId ?? task.id;

    if (!groupMap.has(id)) {
      groupMap.set(id, {
        groupTaskGroupId: id,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority,
        duration: task.duration,
        url: task.url,
        currentUserCompleted: false,
        completedMembers: [],
        inProgressMembers: [],
        totalAssigned: 0,
      });
    }

    const entry = groupMap.get(id)!;
    entry.totalAssigned++;

    if (task.userId === session.user.id) {
      entry.currentUserCompleted = task.completed;
    }

    if (task.completed) {
      entry.completedMembers.push(task.user);
    } else {
      entry.inProgressMembers.push(task.user);
    }
  }

  return Array.from(groupMap.values());
}

/**
 * Marks the current user's copy of a group task as complete or incomplete
 * @param {string} groupTaskGroupId - The shared group task ID
 * @param {string} groupId - The group database ID
 * @param {boolean} completed - The new completion state
 * @return {Promise<{ success: boolean; error?: string }>}
 */
export async function toggleGroupTaskComplete(
  groupTaskGroupId: string,
  groupId: string,
  completed: boolean
) {
  const session = await requireSession();

  await prisma.task.updateMany({
    where: {
      groupTaskGroupId,
      groupId,
      isGroupTask: true,
      userId: session.user.id,
    },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
      status: completed ? "completed" : "todo",
    },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}