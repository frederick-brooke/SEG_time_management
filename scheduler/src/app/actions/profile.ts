'use server'

import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * count the number of accepted friend relationships for a user
 * @param userId the user's database ID
 * @returns {promis<number>}, the count of accepted friend requests
 */
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

/**
 * fetches the current logged in user's profile data
 * @param username 
 * @returns {Promise<Object | null>} - User profile with stats and friend requests, or null if not authenticated
 */
export async function getMyProfile(username: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: {email: session.user.email},
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

  //calculate task statistics
  const completedTasks = user.tasks.filter(t => t.completed).length;
  const totalTasks = user.tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    ...user,
    stats: { completedTasks, totalTasks, completionRate, friendCount }, // Added friendCount
    friendStatus: "ME"
  };
}

/**
 * fetches another user's public profile by username
 * @param username , string value that is the username to look up
 * @returns user profile with stats and friend status or null if not found
 */
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

/**
 * updates the current user's profile information
 * @param formData , form data containing fname, lname and bio
 * @return revalidates the profile page after update
 */
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

/**
 * sends a friend request to another user
 * @param targetUserId , the database ID of the user to send request to
 * @returns creates a pending friend request
 */
export async function sendFriendRequest(targetUserId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.id === targetUserId) return; 

  // check for existing requests in either direction
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
/**
 * accept a pending friend request
 * @param requestId -the databse ID of the friend request
 * @return updates request status to ACCEPTED
 */
export async function acceptFriendRequest(requestId: string) {
  await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: 'ACCEPTED' }
  });
  revalidatePath("/profile");
}

/**
 * rejects and deletes a pending friend request
 * @param requestId ,the database ID of the friend request
 * @return deletes the friend request from database
 */
export async function rejectFriendRequest(requestId: string) {
  await prisma.friendRequest.delete({
    where: { id: requestId }
  });
  revalidatePath("/profile");
}