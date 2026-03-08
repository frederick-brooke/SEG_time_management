'use server';

import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
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
    await syncModuleEventsToNewMember(module.id, session.user.id);
    await syncModuleTasksToNewMember(module.id, session.user.id);
    
    await prisma.moduleMember.create({
      data: {
        moduleId: module.id,
        userId: session.user.id,
        role: 'MEMBER'
      }
    });

    await syncModuleEventsToNewMember(module.id, session.user.id);

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

/**
 * Creates a module event for all members
 * @param {string} moduleId - Module ID
 * @param {Object} eventData - Event details (title, start, end, etc.)
 * @return {Promise<Object>} - Success status
 */
export async function createModuleEvent(moduleId: string, eventData: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Verify user is OWNER of the module
    const membership = await prisma.moduleMember.findUnique({
      where: {
        moduleId_userId: {
          moduleId,
          userId: session.user.id
        }
      }
    });

    if (!membership || membership.role !== 'OWNER') {
      return { success: false, error: "Only module owners can create module events" };
    }

    // Get all module members
    const members = await prisma.moduleMember.findMany({
      where: { moduleId },
      select: { userId: true }
    });

    if (members.length === 0) {
      return { success: false, error: "No members in module" };
    }

    // Create event for each member
    const eventPromises = members.map(member =>
      prisma.event.create({
        data: {
          userId: member.userId,
          moduleId,
          isModuleEvent: true,
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
        }
      })
    );

    await Promise.all(eventPromises);

    revalidatePath(`/modules/${moduleId}`);
    return { success: true, message: `Event created for ${members.length} members` };
  } catch (error) {
    console.error("Failed to create module event:", error);
    return { success: false, error: "Failed to create module event" };
  }
}

/**
 * Deletes a module event from all members' calendars
 * @param {string} moduleId - Module ID
 * @param {string} eventTitle - Event title to match
 * @param {string} eventStart - Event start time
 * @return {Promise<Object>} - Success status
 */
export async function deleteModuleEvent(moduleId: string, eventTitle: string, eventStart: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Verify user is OWNER
    const membership = await prisma.moduleMember.findUnique({
      where: {
        moduleId_userId: {
          moduleId,
          userId: session.user.id
        }
      }
    });

    if (!membership || membership.role !== 'OWNER') {
      return { success: false, error: "Only module owners can delete module events" };
    }

    // Delete all instances of this event across all members
    const result = await prisma.event.deleteMany({
      where: {
        moduleId,
        title: eventTitle,
        start: new Date(eventStart),
        isModuleEvent: true
      }
    });

    revalidatePath(`/modules/${moduleId}`);
    return { success: true, message: `Deleted ${result.count} event instances` };
  } catch (error) {
    console.error("Failed to delete module event:", error);
    return { success: false, error: "Failed to delete module event" };
  }
}

/**
 * Syncs module events to a new member
 * @param {string} moduleId - Module ID
 * @param {string} userId - New member's user ID
 * @return {Promise<void>}
 */
async function syncModuleEventsToNewMember(moduleId: string, userId: string) {
  try {
    // Get all existing module events (from any member)
    const existingEvents = await prisma.event.findMany({
      where: {
        moduleId,
        isModuleEvent: true
      },
      distinct: ['title', 'start'], // Get unique events
      select: {
        title: true,
        description: true,
        start: true,
        end: true,
        allDay: true,
        category: true,
        startCoords: true,
        destinationCoords: true,
        travelDuration: true,
        startLocationName: true,
        destLocationName: true,
        transportMode: true,
        recurrence: true
      }
    });

    // Create copies for the new member
    const eventPromises = existingEvents.map(event =>
      prisma.event.create({
        data: {
          userId,
          moduleId,
          isModuleEvent: true,
          ...event
        }
      })
    );

    
    await Promise.all(eventPromises);
    console.log(`✅ Synced ${existingEvents.length} events to new member`);
  } catch (error) {
    console.error("Failed to sync events to new member:", error);
  }
}

/**
 * Creates a module task for all members
 * @param {string} moduleId - Module ID
 * @param {Object} taskData - Task details (title, dueDate, priority, etc.)
 * @return {Promise<Object>} - Success status
 */
export async function createModuleTask(moduleId: string, taskData: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Verify user is OWNER of the module
    const membership = await prisma.moduleMember.findUnique({
      where: {
        moduleId_userId: {
          moduleId,
          userId: session.user.id
        }
      }
    });

    if (!membership || membership.role !== 'OWNER') {
      return { success: false, error: "Only module owners can create module tasks" };
    }

    // Get all module members
    const members = await prisma.moduleMember.findMany({
      where: { moduleId },
      select: { userId: true }
    });

    if (members.length === 0) {
      return { success: false, error: "No members in module" };
    }

    // Create task for each member
    const taskPromises = members.map(member =>
      prisma.task.create({
        data: {
          userId: member.userId,
          moduleId,
          isModuleTask: true,
          title: taskData.title,
          description: taskData.description || null,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
          priority: taskData.priority || "Low",
          duration: taskData.duration || 0,
          durationHours: taskData.durationHours || null,
          durationMins: taskData.durationMins || null,
          subtasks: taskData.subtasks || [],
          url: taskData.url || null,
          status: "todo",
          completed: false,
        }
      })
    );

    await Promise.all(taskPromises);

    revalidatePath(`/modules/${moduleId}`);
    return { success: true, message: `Task created for ${members.length} members` };
  } catch (error) {
    console.error("Failed to create module task:", error);
    return { success: false, error: "Failed to create module task" };
  }
}

/**
 * Deletes a module task from all members' lists
 * @param {string} moduleId - Module ID
 * @param {string} taskTitle - Task title to match
 * @return {Promise<Object>} - Success status
 */
export async function deleteModuleTask(moduleId: string, taskTitle: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Verify user is OWNER
    const membership = await prisma.moduleMember.findUnique({
      where: {
        moduleId_userId: {
          moduleId,
          userId: session.user.id
        }
      }
    });

    if (!membership || membership.role !== 'OWNER') {
      return { success: false, error: "Only module owners can delete module tasks" };
    }

    // Delete all instances of this task across all members
    const result = await prisma.task.deleteMany({
      where: {
        moduleId,
        title: taskTitle,
        isModuleTask: true
      }
    });

    revalidatePath(`/modules/${moduleId}`);
    return { success: true, message: `Deleted ${result.count} task instances` };
  } catch (error) {
    console.error("Failed to delete module task:", error);
    return { success: false, error: "Failed to delete module task" };
  }
}

/**
 * Syncs module tasks to a new member
 * @param {string} moduleId - Module ID
 * @param {string} userId - New member's user ID
 * @return {Promise<void>}
 */
async function syncModuleTasksToNewMember(moduleId: string, userId: string) {
  try {
    // Get all existing module tasks (from any member)
    const existingTasks = await prisma.task.findMany({
      where: {
        moduleId,
        isModuleTask: true
      },
      distinct: ['title'], // Get unique tasks by title
      select: {
        title: true,
        description: true,
        dueDate: true,
        priority: true,
        duration: true,
        durationHours: true,
        durationMins: true,
        subtasks: true,
        url: true
      }
    });

    // Create copies for the new member
    const taskPromises = existingTasks.map(task =>
      prisma.task.create({
        data: {
          userId,
          moduleId,
          isModuleTask: true,
          status: "todo",
          completed: false,
          ...task
        }
      })
    );

    await Promise.all(taskPromises);
    console.log(`✅ Synced ${existingTasks.length} tasks to new member`);
  } catch (error) {
    console.error("Failed to sync tasks to new member:", error);
  }
}