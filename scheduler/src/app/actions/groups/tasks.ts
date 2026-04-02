'use server';

/**
 * Group task service
 *
 * Handles creating, updating, deleting, and fetching group tasks.
 * Syncs tasks across members and tracks per-user completion/progress.
 */

import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { revalidatePath } from "next/cache";
import { requireSession, isGroupMember, generateGroupId } from "./utils";

//group tasks

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
export async function updateGroupTask(groupTaskGroupId: string, groupId: string, taskData: any) {
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
export async function toggleGroupTaskComplete(groupTaskGroupId: string, groupId: string, completed: boolean) {
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