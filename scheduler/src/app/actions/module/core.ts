'use server';

import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { revalidatePath } from "next/cache";
import { ModuleRole } from "@prisma/client";
import { 
  requireSession, generateUniquePin, isModuleOwner, 
  syncEventsToMember, syncTasksToMember 
} from "./utils";

//module crud

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
    joinPin: userMembership.role === ModuleRole.OWNER ? module.joinPin : undefined,
  };
}

/**
 * Removes the current user's membership from a module and safely deletes their tasks/events
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

  await prisma.event.deleteMany({
    where: { moduleId, userId: session.user.id, isModuleEvent: true }
  });
  await prisma.task.deleteMany({
    where: { moduleId, userId: session.user.id, isModuleTask: true }
  });

  revalidatePath("/modules");
  return { success: true };
}

//module settings

/**
 * Updates core module settings (Name, Description, Max Members)
 * Only the module OWNER can perform this action.
 * @param {string} moduleId - The module database ID
 * @param {object} data - Form data with new settings
 * @return {Promise<{ success: boolean; error?: string }>}
 */
export async function updateModuleSettings(
  moduleId: string, 
  data: { name: string; description: string; maxMembers: number }
) {
  const session = await requireSession();

  if (!(await isModuleOwner(moduleId, session.user.id))) {
    return { success: false, error: "Only module owners can edit settings" };
  }

  if (data.maxMembers < 2 || data.maxMembers > 100) {
    return { success: false, error: "Max members must be between 2 and 100" };
  }

  const currentMemberCount = await prisma.moduleMember.count({
    where: { moduleId }
  });

  if (data.maxMembers < currentMemberCount) {
    return { 
      success: false, 
      error: `Cannot set max members lower than current member count (${currentMemberCount}). Remove members first.` 
    };
  }

  await prisma.module.update({
    where: { id: moduleId },
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      maxMembers: data.maxMembers,
    },
  });

  revalidatePath(`/modules/${moduleId}`);
  return { success: true };
}

/**
 * Updates a member's role (Promote to ADMIN or Demote to MEMBER)
 * Only the module OWNER can perform this action.
 * @param {string} moduleId - The module database ID
 * @param {string} targetUserId - The target user's ID
 * @param {'ADMIN' | 'MEMBER'} newRole - The new role to assign
 * @return {Promise<{ success: boolean; error?: string }>}
 */
export async function updateMemberRole(moduleId: string, targetUserId: string, newRole: 'ADMIN' | 'MEMBER') {
  const session = await requireSession();

  if (!(await isModuleOwner(moduleId, session.user.id))) {
    return { success: false, error: "Only module owners can change member roles" };
  }

  if (session.user.id === targetUserId) {
    return { success: false, error: "You cannot change your own role" };
  }

  await prisma.moduleMember.update({
    where: { moduleId_userId: { moduleId, userId: targetUserId } },
    data: { role: newRole },
  });

  revalidatePath(`/modules/${moduleId}`);
  return { success: true };
}

/**
 * Removes a member from the module and deletes their module-specific tasks/events
 * @param {string} moduleId - The module database ID
 * @param {string} targetUserId - The target user's ID
 * @return {Promise<{ success: boolean; error?: string }>}
 */
export async function removeMember(moduleId: string, targetUserId: string) {
  const session = await requireSession();

  const requester = await prisma.moduleMember.findUnique({
    where: { moduleId_userId: { moduleId, userId: session.user.id } }
  });

  if (!requester || (requester.role !== 'OWNER' && requester.role !== 'ADMIN')) {
    return { success: false, error: "Only owners and admins can remove members" };
  }

  const target = await prisma.moduleMember.findUnique({
    where: { moduleId_userId: { moduleId, userId: targetUserId } }
  });

  if (!target) return { success: false, error: "Member not found" };
  if (target.role === 'OWNER') return { success: false, error: "Cannot remove the owner" };
  if (requester.role === 'ADMIN' && target.role === 'ADMIN') {
    return { success: false, error: "Admins cannot remove other admins" };
  }

  await prisma.moduleMember.delete({
    where: { moduleId_userId: { moduleId, userId: targetUserId } }
  });

  await prisma.event.deleteMany({
    where: { moduleId, userId: targetUserId, isModuleEvent: true }
  });
  await prisma.task.deleteMany({
    where: { moduleId, userId: targetUserId, isModuleTask: true }
  });

  revalidatePath(`/modules/${moduleId}`);
  return { success: true };
}