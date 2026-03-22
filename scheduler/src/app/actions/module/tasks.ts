'use server';

import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { revalidatePath } from "next/cache";
import { ModuleRole } from "@prisma/client";
import { requireSession, isModuleOwner, generateGroupId } from "./utils";

//module tasks

/**
 * Creates a task on every module member's task list, grouped by a shared groupId
 * @param {string} moduleId - The module database ID
 * @param {object} taskData - Task fields (title, dueDate, priority, etc.)
 * @return {Promise<{ success: boolean; message?: string; error?: string }>}
 */
export async function createModuleTask(moduleId: string, taskData: any) {
  const session = await requireSession();

  if (!(await isModuleOwner(moduleId, session.user.id))) {
    return { success: false, error: "Only module owners can create module tasks" };
  }

  const members = await prisma.moduleMember.findMany({
    where: { moduleId },
    select: { userId: true, role: true },
  });

  if (members.length === 0) return { success: false, error: "No members in module" };

  const moduleTaskGroupId = generateGroupId();
  const assignableMembers = members.filter((m) => m.role === ModuleRole.MEMBER);

  await Promise.all(
    assignableMembers.map((member) =>
      prisma.task.create({
        data: {
          userId: member.userId,
          moduleId,
          isModuleTask: true,
          moduleTaskGroupId,
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

  revalidatePath(`/modules/${moduleId}`);
  return { success: true, message: `Task assigned to ${assignableMembers.length} members` };
}

/**
 * Updates all member copies of a module task by group ID
 * @param {string} moduleTaskGroupId - The shared group ID for the task
 * @param {string} moduleId - The module database ID
 * @param {object} taskData - Updated task fields
 * @return {Promise<{ success: boolean; error?: string }>}
 */
export async function updateModuleTask(
  moduleTaskGroupId: string,
  moduleId: string,
  taskData: any
) {
  const session = await requireSession();

  if (!(await isModuleOwner(moduleId, session.user.id))) {
    return { success: false, error: "Only module owners can edit module tasks" };
  }

  await prisma.task.updateMany({
    where: { moduleTaskGroupId, moduleId, isModuleTask: true },
    data: {
      title: taskData.title,
      description: taskData.description || null,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      priority: taskData.priority || "Low",
      duration: taskData.duration || 0,
      url: taskData.url || null,
    },
  });

  revalidatePath(`/modules/${moduleId}`);
  return { success: true };
}

/**
 * Deletes all member copies of a module task by group ID
 * @param {string} moduleTaskGroupId - The shared group ID for the task
 * @param {string} moduleId - The module database ID
 * @return {Promise<{ success: boolean; error?: string }>}
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
 * Gets the current user's module tasks — used for the member view
 * @param {string} moduleId - The module database ID
 * @return {Promise<Array>} - List of the current user's module tasks
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

/**
 * Gets deduplicated tasks with per-member completion progress for the owner view
 * Returns one entry per task group with counts of who completed vs in progress
 * @param {string} moduleId - The module database ID
 * @return {Promise<Array>} - Task groups with progress data
 */
export async function getModuleTasksWithProgress(moduleId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const allTasks = await prisma.task.findMany({
    where: { moduleId, isModuleTask: true },
    include: {
      user: { select: { id: true, username: true, fname: true, lname: true } },
    },
    orderBy: { dueDate: 'asc' },
  });

  const groupMap = new Map<string, {
    moduleTaskGroupId: string;
    title: string;
    description: string | null;
    dueDate: Date | null;
    priority: string;
    duration: number;
    url: string | null;
    completedMembers: { id: string; username: string; fname: string | null; lname: string | null }[];
    inProgressMembers: { id: string; username: string; fname: string | null; lname: string | null }[];
    totalAssigned: number;
  }>();

  for (const task of allTasks) {
    const groupId = task.moduleTaskGroupId ?? task.id;

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

    const group = groupMap.get(groupId)!;
    group.totalAssigned++;

    if (task.completed) {
      group.completedMembers.push(task.user);
    } else {
      group.inProgressMembers.push(task.user);
    }
  }

  return Array.from(groupMap.values());
}