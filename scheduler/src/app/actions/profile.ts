'use server'

import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";

export async function getMyProfile() {
  const session = await getServerSession(authOptions);
  
  // LOG 1: Check who is logged in
  console.log("🔍 getMyProfile called for:", session?.user?.email);

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
      tasks: {
        select: { completed: true }
      }
    }
  });

  if (!user) {
    console.log("❌ User not found in DB!");
    return null;
  }

  // LOG 2: Check what we found in the DB
  console.log(`✅ Found user: ${user.username}, Bio: ${user.bio}`);
  console.log(`📊 Task Count: ${user.tasks.length}`);

  const completedTasks = user.tasks.filter(t => t.completed).length;
  const totalTasks = user.tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    ...user,
    stats: { completedTasks, totalTasks, completionRate },
    friendStatus: "ME"
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
  
  if (!session?.user?.email) {
    console.log("⛔ Unauthorized update attempt");
    throw new Error("Unauthorized");
  }

  const newBio = formData.get("bio") as string;
  const newFname = formData.get("fname") as string;
  const newLname = formData.get("lname") as string;

  // LOG 3: Check what is being saved
  console.log(`📝 Updating profile for ${session.user.email}`);
  console.log(`   - New Bio: "${newBio}"`);

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      fname: newFname,
      lname: newLname,
      bio: newBio,
    },
  });

  console.log("✅ Database update successful");
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