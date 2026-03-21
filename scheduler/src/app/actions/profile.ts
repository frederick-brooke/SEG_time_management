'use server'

import { prisma } from "lib/prisma";
import { FriendStatus as PrismaFriendStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { revalidatePath } from "next/cache";
import { calculateStreak } from "lib/streak";
import {
  fetchUserByUsername,
  fetchFriends,
  fetchFriendCount,
  fetchFriendStatus,
  computeTaskStats,
} from "lib/profile-queries";

// ─── Session helper ───────────────────────────────────────────────────────────

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

// ─── Friend count helper ──────────────────────────────────────────────────────

/**
 * Counts accepted friendships for a user in both directions
 * @param {string} userId - The user ID to count friends for
 * @return {Promise<number>} - Total accepted friend count
 */
async function countFriends(userId: string): Promise<number> {
  return prisma.friendRequest.count({
    where: {
      status: PrismaFriendStatus.ACCEPTED,
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
  });
}

// ─── Profile reads ────────────────────────────────────────────────────────────

/**
 * Fetches the current user's full profile including stats, friends, and pending requests
 * @return {Promise<object | null>} - Own profile data or null if not authenticated
 */
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
      city: true,
      country: true,
      location: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  const [
    progress,
    tasks,
    pendingReceivedRequests,
    sentAcceptedRequests,
    receivedAcceptedRequests,
    friendCount,
    streak,
  ] = await Promise.all([
    prisma.userProgress.findUnique({
      where: { userId: user.id },
      select: {
        coins: true,
        level: true,
        experience: true,
      },
    }),
    prisma.task.findMany({
      where: { userId: user.id },
      select: { completed: true, completedAt: true },
    }),
    prisma.friendRequest.findMany({
      where: { receiverId: user.id, status: PrismaFriendStatus.PENDING },
      include: {
        sender: {
          select: { id: true, username: true, fname: true, lname: true, pfp: true },
        },
      },
    }),
    prisma.friendRequest.findMany({
      where: { senderId: user.id, status: PrismaFriendStatus.ACCEPTED },
      include: {
        receiver: {
          select: { id: true, username: true, fname: true, lname: true, pfp: true },
        },
      },
    }),
    prisma.friendRequest.findMany({
      where: { receiverId: user.id, status: PrismaFriendStatus.ACCEPTED },
      include: {
        sender: {
          select: { id: true, username: true, fname: true, lname: true, pfp: true },
        },
      },
    }),
    countFriends(user.id),
    calculateStreak(user.id),
  ]);

  const friends = [
    ...sentAcceptedRequests.map((req) => req.receiver),
    ...receivedAcceptedRequests.map((req) => req.sender),
  ];

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    ...user,
    progress: progress ?? null,
    receivedRequests: pendingReceivedRequests,
    friends,
    stats: { completedTasks, totalTasks, completionRate, friendCount, streak },
    friendStatus: "ME",
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

// ─── Profile mutation ─────────────────────────────────────────────────────────

/**
 * Updates the current user's profile fields including optional geocoding of city and country
 * @param {FormData} formData - Form data containing fname, lname, bio, city, and country fields
 * @return {Promise<void>}
 */
export async function updateProfile(formData: FormData) {
  const session = await requireSession();

  const fname = formData.get("fname") as string;
  const lname = formData.get("lname") as string;
  const bio = formData.get("bio") as string;
  const city = formData.get("city") as string;
  const country = formData.get("country") as string;

  const updateData: any = {
    fname: fname || null,
    lname: lname || null,
    bio: bio || null,
    city: city || null,
    country: country || null,
  };

  // Geocode city and country into coordinates when both are provided
  // If geocoding fails, location is explicitly cleared to avoid stale coordinates
  if (city && country) {
    updateData.location = null;
    try {
      const apiKey = process.env.OPENCAGE_API_KEY;

      if (!apiKey) {
        console.warn("OPENCAGE_API_KEY is not set; skipping geocoding.");
      } else {
        const query = encodeURIComponent(`${city}, ${country}`);
        const url = `https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${apiKey}&limit=1`;
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          const firstResult = data?.results?.[0];

          if (
            firstResult?.geometry &&
            firstResult.geometry.lat != null &&
            firstResult.geometry.lng != null
          ) {
            updateData.location = {
              lat: firstResult.geometry.lat,
              lng: firstResult.geometry.lng,
            };
          }
        } else {
          console.error("Geocoding request failed with status:", response.status);
        }
      }
    } catch (error) {
      console.error("Error while geocoding city/country:", error);
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
  });

  revalidatePath("/profile");
}

// ─── Friend request mutations ─────────────────────────────────────────────────

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
    data: { senderId, receiverId: targetUserId, status: PrismaFriendStatus.PENDING },
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
    data: { status: PrismaFriendStatus.ACCEPTED },
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
      status: PrismaFriendStatus.ACCEPTED,
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
      status: PrismaFriendStatus.PENDING,
    },
  });

  revalidatePath("/profile");
}