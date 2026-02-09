'use server'

import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";

// Helper: Logic to count friends (used by both functions)
async function getFriendCount(userId: string) {
  return await prisma.friendRequest.count({
    where: {
      status: 'ACCEPTED',
      OR: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }
  });
}

// 1. GET MY PROFILE (Private Dashboard)
export async function getMyProfile() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      username: true,
      fname: true,
      lname: true,
      email: true,
      bio: true,
      pfp: true,
      createdAt: true,
      tasks: { select: { completed: true } },
      // Fetch Incoming Requests so we can Accept/Reject them
      receivedRequests: {
        where: { status: 'PENDING' },
        include: { sender: { select: { username: true, fname: true, lname: true, pfp: true } } }
      }
    }
  });

  if (!user) return null;

  const friendCount = await getFriendCount(user.id);

  // Stats
  const completedTasks = user.tasks.filter(t => t.completed).length;
  const totalTasks = user.tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    ...user,
    stats: { completedTasks, totalTasks, completionRate, friendCount }, // Added friendCount
    friendStatus: "ME"
  };
}

// 2. GET OTHER PROFILE (Public View)
export async function getProfile(username: string) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      fname: true,
      lname: true,
      email: true,
      bio: true,
      pfp: true,
      createdAt: true,
      tasks: { select: { completed: true } },
      // Check relationship status
      sentRequests: { where: { receiverId: currentUserId } },
      receivedRequests: { where: { senderId: currentUserId } }
    }
  });

  if (!user) return null;

  const friendCount = await getFriendCount(user.id);

  // Stats
  const completedTasks = user.tasks.filter(t => t.completed).length;
  const totalTasks = user.tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Determine Friend Status
  let friendStatus = "NONE"; 
  const sent = user.receivedRequests[0]; 
  const received = user.sentRequests[0]; 

  if (sent?.status === 'ACCEPTED' || received?.status === 'ACCEPTED') {
    friendStatus = "FRIENDS";
  } else if (sent?.status === 'PENDING') {
    friendStatus = "REQUEST_SENT";
  } else if (received?.status === 'PENDING') {
    friendStatus = "REQUEST_RECEIVED";
  }

  return {
    ...user,
    stats: { completedTasks, totalTasks, completionRate, friendCount },
    friendStatus,
    requestId: received?.id 
  };
}

// 3. ACTIONS
export async function updateProfile(formData: FormData) {
  // ... (Keep existing code) ...
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      fname: formData.get("fname") as string,
      lname: formData.get("lname") as string,
      bio: formData.get("bio") as string,
    },
  });
  revalidatePath("/profile");
}

export async function sendFriendRequest(targetUserId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.id === targetUserId) return; 

  // Prevent duplicates
  const existing = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId: session.user.id, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: session.user.id }
      ]
    }
  });

  if (existing) return;

  await prisma.friendRequest.create({
    data: {
      senderId: session.user.id,
      receiverId: targetUserId,
      status: 'PENDING'
    }
  });
  revalidatePath("/profile");
}

export async function acceptFriendRequest(requestId: string) {
  await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: 'ACCEPTED' }
  });
  revalidatePath("/profile");
}

// NEW: Ability to reject requests
export async function rejectFriendRequest(requestId: string) {
  await prisma.friendRequest.delete({
    where: { id: requestId }
  });
  revalidatePath("/profile");
}