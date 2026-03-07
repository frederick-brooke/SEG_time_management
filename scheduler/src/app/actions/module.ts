'use server';

import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Generates a unique 6-character alphanumeric join PIN
 * @return {Promise<string>} - Unique join PIN
 */
async function generateUniquePin(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    let pin = '';
    for (let i = 0; i < 6; i++) {
      pin += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const existing = await prisma.module.findUnique({
      where: { joinPin: pin }
    });

    if (!existing) return pin;
    attempts++;
  }

  throw new Error("Failed to generate unique PIN");
}

/**
 * Creates a new module with unique join PIN
 * @param {FormData} formData - Form data containing module details
 * @return {Promise<Object>} - Created module with join PIN
 */
export async function createModule(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const maxMembers = parseInt(formData.get("maxMembers") as string) || 50;

    if (!name || name.trim().length === 0) {
      return { success: false, error: "Module name is required" };
    }

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
        creatorId: session.user.id
      }
    });

    // Automatically add creator as OWNER member
    await prisma.moduleMember.create({
      data: {
        moduleId: module.id,
        userId: session.user.id,
        role: 'OWNER'
      }
    });

    revalidatePath("/modules");
    return { success: true, module, joinPin };
  } catch (error) {
    console.error("Failed to create module:", error);
    return { success: false, error: "Failed to create module" };
  }
}

/**
 * Joins a module using join PIN
 * @param {string} joinPin - 6-character module join PIN
 * @return {Promise<Object>} - Success status and module info
 */
export async function joinModule(joinPin: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const pin = joinPin.trim().toUpperCase();

    if (pin.length !== 6) {
      return { success: false, error: "Invalid PIN format" };
    }

    const module = await prisma.module.findUnique({
      where: { joinPin: pin },
      include: {
        _count: { select: { members: true } }
      }
    });

    if (!module) {
      return { success: false, error: "Invalid PIN - Module not found" };
    }

    // Check if user already a member
    const existingMember = await prisma.moduleMember.findUnique({
      where: {
        moduleId_userId: {
          moduleId: module.id,
          userId: session.user.id
        }
      }
    });

    if (existingMember) {
      return { success: false, error: "You are already a member of this module" };
    }

    // Check if module is full
    if (module._count.members >= module.maxMembers) {
      return { success: false, error: "Module is full" };
    }

    await prisma.moduleMember.create({
      data: {
        moduleId: module.id,
        userId: session.user.id,
        role: 'MEMBER'
      }
    });

    revalidatePath("/modules");
    return { success: true, module };
  } catch (error) {
    console.error("Failed to join module:", error);
    return { success: false, error: "Failed to join module" };
  }
}

/**
 * Gets all modules the current user is a member of
 * @return {Promise<Array>} - List of modules with member count and role
 */
export async function getMyModules() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];

    const memberships = await prisma.moduleMember.findMany({
      where: { userId: session.user.id },
      include: {
        module: {
          include: {
            creator: {
              select: { username: true, fname: true, lname: true }
            },
            _count: { select: { members: true } }
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    });

    return memberships.map(m => ({
      ...m.module,
      memberCount: m.module._count.members,
      userRole: m.role,
      // Only show PIN to module owner
      joinPin: m.role === 'OWNER' ? m.module.joinPin : undefined
    }));
  } catch (error) {
    console.error("Failed to fetch modules:", error);
    return [];
  }
}

/**
 * Gets details of a specific module
 * @param {string} moduleId - Module database ID
 * @return {Promise<Object | null>} - Module details with members list
 */
export async function getModuleDetails(moduleId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        creator: {
          select: { id: true, username: true, fname: true, lname: true, pfp: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, username: true, fname: true, lname: true, pfp: true }
            }
          },
          orderBy: [
            { role: 'asc' },
            { joinedAt: 'asc' }
          ]
        }
      }
    });

    if (!module) return null;

    // Check if current user is a member
    const userMembership = module.members.find(m => m.userId === session.user.id);
    if (!userMembership) return null;

    return {
      ...module,
      userRole: userMembership.role,
      memberCount: module.members.length,
      // Only show PIN to owner
      joinPin: userMembership.role === 'OWNER' ? module.joinPin : undefined
    };
  } catch (error) {
    console.error("Failed to fetch module details:", error);
    return null;
  }
}

/**
 * Leaves a module (removes membership)
 * @param {string} moduleId - Module database ID
 * @return {Promise<Object>} - Success status
 */
export async function leaveModule(moduleId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const membership = await prisma.moduleMember.findUnique({
      where: {
        moduleId_userId: {
          moduleId,
          userId: session.user.id
        }
      }
    });

    if (!membership) {
      return { success: false, error: "You are not a member of this module" };
    }

    if (membership.role === 'OWNER') {
      return { success: false, error: "Module owners cannot leave. Ownership transfer coming soon." };
    }

    await prisma.moduleMember.delete({
      where: {
        moduleId_userId: {
          moduleId,
          userId: session.user.id
        }
      }
    });

    revalidatePath("/modules");
    return { success: true };
  } catch (error) {
    console.error("Failed to leave module:", error);
    return { success: false, error: "Failed to leave module" };
  }
}