
/**
 * @file groupTaskActions.ts
 * @description Handles creating, updating, deleting, and fetching group tasks.
 * Syncs tasks across members and tracks per-user completion/progress.
 */

'use server';

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { requireSession, isGroupMember, generateGroupId } from "./utils";

/** * Strict interface for task creation to prevent runtime schema mismatches 
 */
interface GroupTaskInput {
  title: string;
  description?: string;
  dueDate?: string | Date;
  priority?: "Low" | "Medium" | "High";
  duration?: number;
  subtasks?: string[];
  url?: string;
}

/**
 * Creates a synchronized task for every member of a group.
 * Uses a Database Transaction to ensure all members receive the task atomically.
 *  @param {string} groupId - The unique identifier of the group.
 * @param {GroupTaskInput} taskData - The core data payload for the new task.
 * @returns {Promise<{ success: boolean; message?: string; error?: string }>} An object indicating the success or failure of the operation.
 */
export async function createGroupTask(groupId: string, taskData: GroupTaskInput) {
  const session = await requireSession();

  if (!(await isGroupMember(groupId, session.user.id))) {
    return { success: false, error: "Unauthorized: Member access required." };
  }

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });

  if (members.length === 0) return { success: false, error: "Group has no members." };

  const groupTaskGroupId = generateGroupId();

  try {
    // Transaction ensures data integrity if a single create call fails
    await prisma.$transaction(
      members.map((member) =>
        prisma.task.create({
          data: {
            userId: member.userId,
            groupId,
            isGroupTask: true,
            groupTaskGroupId,
            title: taskData.title,
            description: taskData.description ?? null,
            dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
            priority: taskData.priority ?? "Low",
            duration: taskData.duration ?? 0,
            subtasks: taskData.subtasks ?? [],
            url: taskData.url ?? null,
            status: "todo",
            completed: false,
          },
        })
      )
    );

    revalidatePath(`/groups/${groupId}`);
    return { success: true, message: `Task assigned to ${members.length} members.` };
  } catch (err) {
    console.error("Group task creation failed:", err);
    return { success: false, error: "Failed to distribute group tasks." };
  }
}

/**
 * Updates core metadata across all instances of a group task.
 *  @param {string} groupTaskGroupId - The shared identifier linking the tasks across all members.
 * @param {string} groupId - The unique identifier of the group.
 * @param {GroupTaskInput} taskData - The updated data payload for the task.
 * @returns {Promise<{ success: boolean; error?: string }>} An object indicating the success or failure of the operation.
 */
export async function updateGroupTask(groupTaskGroupId: string, groupId: string, taskData: GroupTaskInput) {
  const session = await requireSession();

  if (!(await isGroupMember(groupId, session.user.id))) {
    return { success: false, error: "Unauthorized" };
  }

  await prisma.task.updateMany({
    where: { groupTaskGroupId, groupId, isGroupTask: true },
    data: {
      title: taskData.title,
      description: taskData.description ?? null,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      priority: taskData.priority ?? "Low",
      duration: taskData.duration ?? 0,
      url: taskData.url ?? null,
    },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * Deletes all instances of a group task across all members.
 *  @param {string} groupTaskGroupId - The shared identifier linking the tasks across all members.
 * @param {string} groupId - The unique identifier of the group.
 * @returns {Promise<{ success: boolean; error?: string }>} An object indicating the success or failure of the operation.
 */
export async function deleteGroupTask(groupTaskGroupId: string, groupId: string) {
  const session = await requireSession();

  if (!(await isGroupMember(groupId, session.user.id))) {
    return { success: false, error: "Unauthorized" };
  }

  await prisma.task.deleteMany({
    where: { groupTaskGroupId, groupId, isGroupTask: true },
  });

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * Aggregates group tasks into a deduplicated list with per-member progress tracking.
 *  @param {string} groupId - The unique identifier of the group.
 * @returns {Promise<Array>} An array of aggregated task data including completion statistics.
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
 * Aggregates group tasks into a deduplicated list with per-member progress tracking.
 *  @param {string} groupId - The unique identifier of the group.
 * @returns {Promise<Array>} An array of aggregated task data including completion statistics.
 */
export async function getGroupTasksWithProgress(groupId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const allTasks = await prisma.task.findMany({
    where: { groupId, isGroupTask: true },
    include: {
      user: { 
        select: { 
          id: true, 
          username: true, 
          fname: true, 
          lname: true, 
          pfp: true 
        } 
      },
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
    inProgressMembers: { id: string; username: string; fname: string | null; lname: string | null; pfp: string | null }[];
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
 * Toggles completion status for the current user's instance of a group task.
 * @param {string} groupTaskGroupId - The shared identifier linking the tasks.
 * @param {string} groupId - The unique identifier of the group.
 * @param {boolean} completed - The new boolean completion state.
 * @returns {Promise<{ success: boolean; error?: string }>} An object indicating the success or failure of the operation.
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