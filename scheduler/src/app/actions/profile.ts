'use server'

import prisma from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";

// 1. GET PROFILE (View your own or someone else's)
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
      bio: true,
      pfp: true,
      tasks: true,
      createdAt: true,
      sentRequests: { where: { receiverId: currentUserId } },
      receivedRequests: { where: { senderId: currentUserId } }
    }
  });

  if (!user) return null;

  // Calculate Stats
  const completedTasks = user.tasks.filter(t => t.completed).length;
  const totalTasks = user.tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Friend Status
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
    stats: { completedTasks, totalTasks, completionRate },
    friendStatus,
    requestId: received?.id 
  };
}

// 2. UPDATE PROFILE
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

// 3. SEND REQUEST
export async function sendFriendRequest(targetUserId: string) {
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

// 4. ACCEPT REQUEST
export async function acceptFriendRequest(requestId: string) {
  await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: 'ACCEPTED' }
  });
  revalidatePath("/profile");
}