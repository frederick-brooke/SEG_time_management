'use server';

/**
 * @file core.tsx
 * @description Profile service
 * Handles fetching and updating user profiles, including stats,
 * friends, streaks, and friendship status.
 */

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
import { requireSession, countFriends } from "./utils";

/**
 * Fetches the current user's full profile including stats, friends, and pending requests.
 * @return {Promise<object | null>} Own profile data or null if not authenticated.
 */
export async function getMyProfile() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true, username: true, fname: true, lname: true, email: true,
      bio: true, pfp: true, city: true, country: true, location: true, createdAt: true,
    },
  });

  if (!user) return null;

  const [
    progress, tasks, pendingReceivedRequests, friends, friendCount, streak,
  ] = await Promise.all([
    prisma.userProgress.findUnique({
      where: { userId: user.id },
      select: { coins: true, level: true, experience: true },
    }),
    prisma.task.findMany({
      where: { userId: user.id },
      select: { completed: true, completedAt: true },
    }),
    prisma.friendRequest.findMany({
      where: { receiverId: user.id, status: PrismaFriendStatus.PENDING, senderId: { not: undefined } },
      include: { sender: { select: { id: true, username: true, fname: true, lname: true, pfp: true } } },
    }),
<<<<<<< HEAD
    fetchFriends(user.id),
=======
    prisma.friendRequest.findMany({
      where: { senderId: user.id, status: PrismaFriendStatus.ACCEPTED, receiverId: { not: undefined } },
      include: { receiver: { select: { id: true, username: true, fname: true, lname: true, pfp: true } } },
    }),
    prisma.friendRequest.findMany({
      where: { receiverId: user.id, status: PrismaFriendStatus.ACCEPTED, senderId: { not: undefined } },
      include: { sender: { select: { id: true, username: true, fname: true, lname: true, pfp: true } } },
    }),
>>>>>>> c58a8f03767f48b722a554f4fe9f15483f0218e2
    countFriends(user.id),
    calculateStreak(user.id),
  ]);

  return {
    ...user,
    progress: progress ?? null,
    receivedRequests: pendingReceivedRequests,
    friends,
    stats: { ...computeTaskStats(tasks), friendCount, streak },
    friendStatus: "ME",
  };
}

/**
 * Fetches another user's public profile including stats, friends, and friendship status.
 * @param {string} username - The username of the profile to fetch.
 * @return {Promise<object | null>} Profile data with friendship status, or null if not found.
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
type ProfileUpdatePayload = {
  fname: string | null;
  lname: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  location?: { lat: number; lng: number } | null;
};

/**
 * Helper to extract profile fields from FormData
 */
function extractProfileFields(formData: FormData): ProfileUpdatePayload {
  return {
    fname: (formData.get("fname") as string) || null,
    lname: (formData.get("lname") as string) || null,
    bio: (formData.get("bio") as string) || null,
    city: (formData.get("city") as string) || null,
    country: (formData.get("country") as string) || null,
  };
}

/**
 * Resolves a city and country string to lat/lng coordinates via OpenCage.
 * Returns null if the API key is missing, the request fails, or no result is found.
 */
async function geocode(city: string, country: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.OPENCAGE_API_KEY;
  
  if (!apiKey) {
    console.warn("OPENCAGE_API_KEY is not set; skipping geocoding.");
    return null;
  }
  
  const query = encodeURIComponent(`${city}, ${country}`);
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${query}&key=${apiKey}&limit=1`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Geocoding request failed with status:", response.status);
      return null;
    }
    
    const data = await response.json();
    const geometry = data?.results?.[0]?.geometry;
    
    return geometry?.lat != null && geometry?.lng != null
      ? { lat: geometry.lat, lng: geometry.lng }
      : null;
  } catch (error) {
    console.error("Error while geocoding city/country:", error);
    return null;
  }
}

/**
 * Updates the current user's profile fields including optional geocoding of city and country.
 * V.3.2: Maintains a single level of abstraction by utilizing helper functions.
 * @param {FormData} formData - Form data containing fname, lname, bio, city, and country fields.
 * @return {Promise<void>}
 */
export async function updateProfile(formData: FormData) {
  const session = await requireSession();
  
  const fields = extractProfileFields(formData);
  const location = fields.city && fields.country 
    ? await geocode(fields.city, fields.country) 
    : undefined;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { ...fields, ...(location !== undefined && { location }) },
  });

  revalidatePath("/profile");
}