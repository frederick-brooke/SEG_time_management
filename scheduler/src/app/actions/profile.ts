'use server'

import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { revalidatePath } from "next/cache";
import { calculateStreak } from "lib/streak";
import {
  fetchUserByEmail,
  fetchUserByUsername,
  fetchFriends,
  fetchFriendCount,
  fetchFriendStatus,
  computeTaskStats,
} from "lib/profile-queries";


/**
 * Retrieves the current session and throws if the user is not authenticated
 * @return {Promise<Session>} - Authenticated session object
 * @throws {Error} - If no valid session exists
 */
async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}


/**
 * Fetches the current user's full profile including stats, friends, and pending requests
 * @return {Promise<object | null>} - Own profile data or null if not authenticated
 */
export async function getMyProfile() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await fetchUserByEmail(session.user.email);
  if (!user) return null;

  const [friends, friendCount, streak] = await Promise.all([
    fetchFriends(user.id),
    fetchFriendCount(user.id),
    calculateStreak(user.id),
  ]);

  return {
    ...user,
    friends,
    stats: { ...computeTaskStats(user.tasks), friendCount, streak },
    friendStatus: "ME" as const,
  };
}

/**
 * Fetches another user's public profile including stats, friends, and friendship status
 * @param {string} username - The username of the profile to fetch
 * @return {Promise<object | null>} - Profile data with friendship status, or null if not found
 */
export async function getProfile(username: string) {
  const session = await getServerSession(authOptions);
  const viewerId = session?.user?.id ?? "UNAUTHENTICATED";

  const user = await fetchUserByUsername(username);
  if (!user) return null;

  const [friends, friendCount, streak, { status: friendStatus, requestId }] =
    await Promise.all([
      fetchFriends(user.id),
      fetchFriendCount(user.id),
      calculateStreak(user.id),
      fetchFriendStatus(viewerId, user.id),
    ]);

  return {
    ...user,
    friends,
    stats: { ...computeTaskStats(user.tasks), friendCount, streak },
    friendStatus,
    requestId,
  };
}

/**
 * Updates the current user's profile fields from a form submission
 * @param {FormData} formData - Form data containing fname, lname, and bio fields
 * @return {Promise<void>}
 */
export async function updateProfile(formData: FormData) {
  const session = await requireSession();

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
 * Sends a friend request from the current user to a target user
 * @param {string} targetUserId - The database ID of the user to send a request to
 * @return {Promise<void>}
 */
export async function sendFriendRequest(targetUserId: string) {
  const session = await requireSession();
  const senderId = session.user.id;

  if (senderId === targetUserId) return;

  // Do nothing if a request already exists in either direction
  const existing = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: senderId },
      ],
    },
  });

  if (existing) return;

  await prisma.friendRequest.create({
    data: { senderId, receiverId: targetUserId, status: "PENDING" },
  });

  revalidatePath("/profile");
}

/**
 * Accepts a pending friend request by updating its status to ACCEPTED
 * @param {string} requestId - The database ID of the friend request to accept
 * @return {Promise<void>}
 */
export async function acceptFriendRequest(requestId: string) {
  await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: "ACCEPTED" },
  });

  revalidatePath("/profile");
}

/**
 * Rejects a pending friend request by deleting it from the database
 * @param {string} requestId - The database ID of the friend request to reject
 * @return {Promise<void>}
 */
export async function rejectFriendRequest(requestId: string) {
  await prisma.friendRequest.delete({
    where: { id: requestId },
  });

  revalidatePath("/profile");
}

/**
 * Removes an existing friendship between the current user and another user
 * @param {string} friendUserId - The database ID of the friend to remove
 * @return {Promise<void>}
 */
export async function removeFriend(friendUserId: string) {
  const session = await requireSession();
  const userId = session.user.id;

  await prisma.friendRequest.deleteMany({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: userId, receiverId: friendUserId },
        { senderId: friendUserId, receiverId: userId },
      ],
    },
  });

  revalidatePath("/profile");
}

/**
 * Cancels a pending outgoing friend request sent by the current user
 * @param {string} targetUserId - The database ID of the user the request was sent to
 * @return {Promise<void>}
 */
export async function cancelFriendRequest(targetUserId: string) {
  const session = await requireSession();

  await prisma.friendRequest.deleteMany({
    where: {
      senderId: session.user.id,
      receiverId: targetUserId,
      status: "PENDING",
    },
  });

  revalidatePath("/profile");
}