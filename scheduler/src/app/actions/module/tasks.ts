'use server';

/**
 * Module task service
 *
 * Handles creation, updates, deletion, and retrieval of module tasks.
 * Syncs tasks across members and provides per-user progress views.
 */

import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { revalidatePath } from "next/cache";
import { requireSession, isModuleOwner, generateGroupId } from "./utils";

/** Strict interface for task creation to prevent runtime schema mismatches */
interface ModuleTaskInput {
  title: string;
  description?: string;
  dueDate?: string | Date;
  priority?: "Low" | "Medium" | "High";
  duration?: number;
  subtasks?: string[];
  url?: string;
}

/**
 * Creates a synchronized task for every member of a module.
 * Uses a database transaction to ensure all members receive the task atomically.
 * Always includes the owner so the task persists even with zero enrolled members.
 *
 * @param {string} moduleId - The unique identifier of the module.
 * @param {ModuleTaskInput} taskData - The core data payload for the new task.
 * @returns {Promise<{ success: boolean; message?: string; error?: string }>} An object indicating the success or failure of the operation.
 */
export async function createModuleTask(moduleId: string, taskData: ModuleTaskInput) {
  const session = await requireSession();

  if (!(await isModuleOwner(moduleId, session.user.id))) {
    return { success: false, error: "Only module owners can create module tasks" };
  }

  const members = await prisma.moduleMember.findMany({
    where: { moduleId },
    select: { userId: true, role: true },
  });

  const moduleTaskGroupId = generateGroupId();

  const memberIds = members
    .filter((m) => m.role === 'MEMBER')
    .map((m) => m.userId);

  if (!memberIds.includes(session.user.id)) {
    memberIds.push(session.user.id);
  }

  try {
    await prisma.$transaction(
      memberIds.map((userId) =>
        prisma.task.create({
          data: {
            userId,
            moduleId,
            isModuleTask: true,
            moduleTaskGroupId,
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

    revalidatePath(`/modules/${moduleId}`);
    return { success: true, message: `Task assigned to ${memberIds.length} members.` };
  } catch (err) {
    console.error("Module task creation failed:", err);
    return { success: false, error: "Failed to distribute module tasks." };
  }
}

/**
 * Updates core metadata across all instances of a module task.
 *
 * @param {string} moduleTaskGroupId - The shared identifier linking the tasks across all members.
 * @param {string} moduleId - The unique identifier of the module.
 * @param {ModuleTaskInput} taskData - The updated data payload for the task.
 * @returns {Promise<{ success: boolean; error?: string }>} An object indicating the success or failure of the operation.
 */
export async function updateModuleTask(
  moduleTaskGroupId: string,
  moduleId: string,
  taskData: ModuleTaskInput,
) {
  const session = await requireSession();

  if (!(await isModuleOwner(moduleId, session.user.id))) {
    return { success: false, error: "Only module owners can edit module tasks" };
  }

  await prisma.task.updateMany({
    where: { moduleTaskGroupId, moduleId, isModuleTask: true },
    data: {
      title: taskData.title,
      description: taskData.description ?? null,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      priority: taskData.priority ?? "Low",
      duration: taskData.duration ?? 0,
      url: taskData.url ?? null,
    },
  });

  revalidatePath(`/modules/${moduleId}`);
  return { success: true };
}

/**
 * Deletes all instances of a module task across all members.
 *
 * @param {string} moduleTaskGroupId - The shared identifier linking the tasks across all members.
 * @param {string} moduleId - The unique identifier of the module.
 * @returns {Promise<{ success: boolean; error?: string }>} An object indicating the success or failure of the operation.
 */
export async function deleteModuleTask(moduleTaskGroupId: string, moduleId: string) {
  const session = await requireSession();

  if (!(await isModuleOwner(moduleId, session.user.id))) {
    return { success: false, error: "Only module owners can delete module tasks" };
  }

  await prisma.task.deleteMany({
    where: { moduleTaskGroupId, moduleId, isModuleTask: true },
  });

  revalidatePath(`/modules/${moduleId}`);
  return { success: true };
}

/**
 * Fetches the current user's module tasks for the member view.
 *
 * @param {string} moduleId - The unique identifier of the module.
 * @returns {Promise<Array>} A list of the current user's module tasks.
 */
export async function getModuleTasks(moduleId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  return prisma.task.findMany({
    where: { moduleId, isModuleTask: true, userId: session.user.id },
    select: {
      id: true,
      moduleTaskGroupId: true,
      title: true,
      description: true,
      dueDate: true,
      priority: true,
      duration: true,
      completed: true,
      status: true,
    },
    orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }],
  });
}

type MemberInfo = {
  id: string;
  username: string;
  fname: string | null;
  lname: string | null;
  pfp: string | null;
};

type TaskGroup = {
  moduleTaskGroupId: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  priority: string;
  duration: number;
  url: string | null;
  completedMembers: MemberInfo[];
  inProgressMembers: MemberInfo[];
  totalAssigned: number;
};

/**
 * Resolves or initialises the task group entry for a given group ID.
 *
 * @param {Map<string, TaskGroup>} groupMap - The accumulator map of task groups.
 * @param {string} groupId - The group ID to resolve.
 * @param {object} task - The source task used to seed the entry if missing.
 * @returns {TaskGroup} The existing or newly created task group entry.
 */
function resolveGroupEntry(
  groupMap: Map<string, TaskGroup>,
  groupId: string,
  task: { title: string; description: string | null; dueDate: Date | null; priority: string; duration: number; url: string | null },
): TaskGroup {
  if (!groupMap.has(groupId)) {
    groupMap.set(groupId, {
      moduleTaskGroupId: groupId,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      duration: task.duration,
      url: task.url,
      completedMembers: [],
      inProgressMembers: [],
      totalAssigned: 0,
    });
  }

  return groupMap.get(groupId)!;
}

/**
 * Accumulates a member's completion state into the correct task group bucket.
 * Owners and Admins are excluded so they do not skew student progress statistics.
 *
 * @param {TaskGroup} group - The task group entry to update.
 * @param {MemberInfo} member - The member whose state is being recorded.
 * @param {boolean} completed - Whether the member has completed the task.
 * @param {string | undefined} role - The member's module role.
 */
function accumulateMemberProgress(
  group: TaskGroup,
  member: MemberInfo,
  completed: boolean,
  role: string | undefined,
) {
  if (role !== 'MEMBER') return;

  group.totalAssigned++;

  if (completed) {
    group.completedMembers.push(member);
  } else {
    group.inProgressMembers.push(member);
  }
}

/**
 * Gets deduplicated tasks with per-member completion progress for the owner view.
 * Owners and Admins are excluded from progress statistics.
 *
 * @param {string} moduleId - The unique identifier of the module.
 * @returns {Promise<Array>} An array of aggregated task data including completion statistics.
 */
export async function getModuleTasksWithProgress(moduleId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const allTasks = await prisma.task.findMany({
    where: { moduleId, isModuleTask: true },
    include: {
      user: { select: { id: true, username: true, fname: true, lname: true, pfp: true } },
    },
    orderBy: { dueDate: 'asc' },
  });

  const moduleMembers = await prisma.moduleMember.findMany({
    where: { moduleId },
    select: { userId: true, role: true },
  });

  const roleMap = new Map(moduleMembers.map((m) => [m.userId, m.role]));
  const groupMap = new Map<string, TaskGroup>();

  for (const task of allTasks) {
    const groupId = task.moduleTaskGroupId ?? task.id;
    const group = resolveGroupEntry(groupMap, groupId, task);
    accumulateMemberProgress(group, task.user, task.completed, roleMap.get(task.userId));
  }

  return Array.from(groupMap.values());
}