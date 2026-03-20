'use server';

import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { revalidatePath } from "next/cache";
import { ModuleRole } from "@prisma/client";
import { randomBytes } from "crypto";


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

//pin generation
/**
 * Generates a random 6-character alphanumeric string
 * @return {string} - Candidate PIN string
 */
function generatePin(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
}

/**
 * Generates a PIN that does not already exist in the database
 * @return {Promise<string>} - Unique join PIN
 * @throws {Error} - If a unique PIN cannot be generated within 10 attempts
 */
async function generateUniquePin(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const pin = generatePin();
    const existing = await prisma.module.findUnique({ where: { joinPin: pin } });
    if (!existing) return pin;
  }
  throw new Error("Failed to generate unique PIN after 10 attempts");
}

/**
 * Generates a random hex string to use as a group ID for module tasks/events
 * @return {string} - 24-character hex group ID
 */
function generateGroupId(): string {
  return randomBytes(12).toString('hex');
}

// ─── Ownership guard ──────────────────────────────────────────────────────────

/**
 * Verifies the current user is an OWNER of the given module
 * @param {string} moduleId - The module database ID to check
 * @param {string} userId - The user ID to verify ownership for
 * @return {Promise<boolean>} - True if user is owner, false otherwise
 */
async function isModuleOwner(moduleId: string, userId: string): Promise<boolean> {
  const membership = await prisma.moduleMember.findUnique({
    where: { moduleId_userId: { moduleId, userId } },
  });
  return membership?.role === ModuleRole.OWNER;
}

//helpers
/**
 * Copies all existing module events to a newly joined member's calendar
 * @param {string} moduleId - The module database ID
 * @param {string} userId - The new member's user ID
 * @return {Promise<void>}
 */
async function syncEventsToMember(moduleId: string, userId: string): Promise<void> {
  const existingEvents = await prisma.event.findMany({
    where: { moduleId, isModuleEvent: true },
    distinct: ['moduleEventGroupId'],
    select: {
      moduleEventGroupId: true, title: true, description: true,
      start: true, end: true, allDay: true, category: true,
      startCoords: true, destinationCoords: true, travelDuration: true,
      startLocationName: true, destLocationName: true,
      transportMode: true, recurrence: true,
    },
  });

  await Promise.all(
    existingEvents.map((event) =>
      prisma.event.create({ data: { userId, moduleId, isModuleEvent: true, ...event } })
    )
  );
}

/**
 * Copies all existing module tasks to a newly joined member's task list
 * @param {string} moduleId - The module database ID
 * @param {string} userId - The new member's user ID
 * @return {Promise<void>}
 */
async function syncTasksToMember(moduleId: string, userId: string): Promise<void> {
  const existingTasks = await prisma.task.findMany({
    where: { moduleId, isModuleTask: true },
    distinct: ['moduleTaskGroupId'],
    select: {
      moduleTaskGroupId: true, title: true, description: true,
      dueDate: true, priority: true, duration: true, subtasks: true, url: true,
    },
  });

  await Promise.all(
    existingTasks.map((task) =>
      prisma.task.create({
        data: { userId, moduleId, isModuleTask: true, status: "todo", completed: false, ...task },
      })
    )
  );
}

//model crud
/**
 * Creates a new module and adds the creator as OWNER
 * @param {FormData} formData - Form data containing name, description, and maxMembers
 * @return {Promise<{ success: boolean; module?: object; joinPin?: string; error?: string }>}
 */
export async function createModule(formData: FormData) {
  const session = await requireSession();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const maxMembers = parseInt(formData.get("maxMembers") as string) || 50;

  if (!name?.trim()) return { success: false, error: "Module name is required" };
  if (maxMembers < 2 || maxMembers > 100) {
    return { success: false, error: "Max members must be between 2 and 100" };
  }

  const joinPin = await generateUniquePin();

  const module = await prisma.module.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      maxMembers,
      joinPin,
      creatorId: session.user.id,
    },
  });

  // Automatically add creator as OWNER member
  await prisma.moduleMember.create({
    data: { moduleId: module.id, userId: session.user.id, role: ModuleRole.OWNER },
  });

  revalidatePath("/modules");
  return { success: true, module, joinPin };
}

/**
 * Joins a module using a 6-character PIN, syncing existing events and tasks
 * @param {string} joinPin - The module's join PIN
 * @return {Promise<{ success: boolean; module?: object; error?: string }>}
 */
export async function joinModule(joinPin: string) {
  const session = await requireSession();
  const pin = joinPin.trim().toUpperCase();

  if (pin.length !== 6) return { success: false, error: "Invalid PIN format" };

  const module = await prisma.module.findUnique({
    where: { joinPin: pin },
    include: { _count: { select: { members: true } } },
  });

  if (!module) return { success: false, error: "Invalid PIN - Module not found" };

  const existingMember = await prisma.moduleMember.findUnique({
    where: { moduleId_userId: { moduleId: module.id, userId: session.user.id } },
  });

  if (existingMember) return { success: false, error: "You are already a member of this module" };

  if (module._count.members >= module.maxMembers) {
    return { success: false, error: "Module is full" };
  }

  // Create membership first, then sync content
  await prisma.moduleMember.create({
    data: { moduleId: module.id, userId: session.user.id, role: ModuleRole.MEMBER },
  });

  await Promise.all([
    syncEventsToMember(module.id, session.user.id),
    syncTasksToMember(module.id, session.user.id),
  ]);

  revalidatePath("/modules");
  return { success: true, module };
}

/**
 * Gets all modules the current user is a member of
 * @return {Promise<Array>} - List of modules with member count and user role
 */
export async function getMyModules() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const memberships = await prisma.moduleMember.findMany({
    where: { userId: session.user.id },
    include: {
      module: {
        include: {
          creator: { select: { username: true, fname: true, lname: true } },
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  return memberships.map((m) => ({
    ...m.module,
    memberCount: m.module._count.members,
    userRole: m.role,
    // Only expose PIN to module owner
    joinPin: m.role === ModuleRole.OWNER ? m.module.joinPin : undefined,
  }));
}

/**
 * Gets full details for a specific module, including members list
 * @param {string} moduleId - The module database ID
 * @return {Promise<object | null>} - Module details or null if not found or not a member
 */
export async function getModuleDetails(moduleId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      creator: {
        select: { id: true, username: true, fname: true, lname: true, pfp: true },
      },
      members: {
        include: {
          user: { select: { id: true, username: true, fname: true, lname: true, pfp: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
  });

  if (!module) return null;

  const userMembership = module.members.find((m) => m.userId === session.user.id);
  if (!userMembership) return null;

  return {
    ...module,
    userRole: userMembership.role,
    memberCount: module.members.length,
    // Only expose PIN to owner
    joinPin: userMembership.role === ModuleRole.OWNER ? module.joinPin : undefined,
  };
}

/**
 * Removes the current user's membership from a module
 * @param {string} moduleId - The module database ID to leave
 * @return {Promise<{ success: boolean; error?: string }>}
 */
export async function leaveModule(moduleId: string) {
  const session = await requireSession();

  const membership = await prisma.moduleMember.findUnique({
    where: { moduleId_userId: { moduleId, userId: session.user.id } },
  });

  if (!membership) return { success: false, error: "You are not a member of this module" };
  if (membership.role === ModuleRole.OWNER) {
    return { success: false, error: "Module owners cannot leave. Transfer ownership first." };
  }

  await prisma.moduleMember.delete({
    where: { moduleId_userId: { moduleId, userId: session.user.id } },
  });

  revalidatePath("/modules");
  return { success: true };
}

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

  const members = await prisma.moduleMember.findMany({
    where: { moduleId },
    select: { userId: true },
  });

  if (members.length === 0) return { success: false, error: "No members in module" };

  // All copies of this event share a groupId so they can be updated/deleted together
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

  // Fetch one copy per group (the current user's copy) ordered by start date
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

// ─── Module tasks ─────────────────────────────────────────────────────────────

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

  // All copies of this task share a groupId so progress can be tracked across members
  const moduleTaskGroupId = generateGroupId();

  // Only assign tasks to non-owner members — owners/admins set the tasks, not complete them
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
 * Returns one entry per task group with counts of who completed vs in progress,
 * and the names of members in each state
 * @param {string} moduleId - The module database ID
 * @return {Promise<Array>} - Task groups with progress data
 */
export async function getModuleTasksWithProgress(moduleId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  // Fetch all member copies of all tasks in the module
  const allTasks = await prisma.task.findMany({
    where: { moduleId, isModuleTask: true },
    include: {
      user: { select: { id: true, username: true, fname: true, lname: true } },
    },
    orderBy: { dueDate: 'asc' },
  });

  // Group by moduleTaskGroupId, deduplicating into one entry per task
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