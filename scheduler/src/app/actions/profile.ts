'use server'

import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";

// ✅ NEW: Specific function for the /profile page
export async function getMyProfile() {
  const session = await getServerSession(authOptions);
  
  // If no session or email, we can't find the profile
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }, // Search by EMAIL, not username
    select: {
      id: true,
      username: true,
      fname: true,
      lname: true,
      email: true,
      bio: true,
      pfp: true,
      createdAt: true,
      tasks: {
        select: { completed: true }
      },
      // For "My Profile", we don't strictly need friend request status relative to ourselves,
      // but we can keep the structure consistent if you like.
    }
  });

  if (!user) return null;

  // Calculate Stats
  const completedTasks = user.tasks.filter(t => t.completed).length;
  const totalTasks = user.tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    ...user,
    stats: { completedTasks, totalTasks, completionRate },
    friendStatus: "ME" // It's your own profile
  };
}

// ... Keep your existing getProfile, updateProfile, etc. below ...

// 1. GET PROFILE (View someone else's profile by username)
export async function getProfile(username: string) {
  // ... (keep your existing code here for viewing other users) ...
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
      tasks: {
        select: { completed: true }
      },
      sentRequests: { where: { receiverId: currentUserId } },
      receivedRequests: { where: { senderId: currentUserId } }
    }
  });

  if (!user) return null;

  const completedTasks = user.tasks.filter(t => t.completed).length;
  const totalTasks = user.tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  let friendStatus = "NONE"; 
  const sent = user.receivedRequests?.[0]; 
  const received = user.sentRequests?.[0]; 

  if (sent?.status === 'ACCEPTED' || received?.status === 'ACCEPTED') {
    friendStatus = "FRIENDS";
  } else if (sent?.status === 'PENDING') {
    friendStatus = "REQUEST_SENT";
  } else if (received?.status === 'PENDING') {
    friendStatus = "REQUEST_RECEIVED";
  }

  return {
    ...user,
    stats: { completedTasks, totalTasks, completionRate },
    friendStatus,
    requestId: received?.id 
  };
}

export async function updateProfile(formData: FormData) {
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
    // ... keep existing code ...
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");
    if (session.user.id === targetUserId) return; 

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
    // ... keep existing code ...
    await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' }
    });
    revalidatePath("/profile");
}