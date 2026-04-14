'use server';

/**
 * Friend request service
 *
 * Handles sending, accepting, declining, cancelling, and removing friendships.
 * Uses a single FriendRequest model to represent both pending and accepted states.
 */

import { prisma } from "@/lib/prisma";
import { FriendStatus as PrismaFriendStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireSession } from "./utils";

/**
 * Sends a friend request to another user.
 * Prevents duplicate or reverse-direction requests from existing.
 *
 * @param {string} receiverId - The user ID of the recipient
 * @returns {Promise<{ success: boolean; error?: string } | void>}
 */
export async function sendFriendRequest(receiverId: string) {
  const session = await requireSession();
  
  // Prevent sending multiple requests to the same person
  const existing = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId: session.user.id, receiverId },
        { senderId: receiverId, receiverId: session.user.id }
      ]
    }
  });
  if (existing) return { success: false, error: "Request already exists" };

  await prisma.friendRequest.create({
    data: { senderId: session.user.id, receiverId, status: PrismaFriendStatus.PENDING },
  });
  revalidatePath("/profile", "layout");
}

/**
 * Accepts a pending friend request from another user.
 *
 * @param {string} senderId - The user ID of the person who sent the request
 * @returns {Promise<void>}
 */
export async function acceptFriendRequest(requestId: string) {
  const session = await requireSession();
  await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: PrismaFriendStatus.ACCEPTED },
  });
  revalidatePath("/profile", "layout");  
}

/**
 * Declines (deletes) a pending friend request from another user.
 *
 * @param {string} senderId - The user ID of the person who sent the request
 * @returns {Promise<void>}
 */
export async function declineFriendRequest(requestId: string) {
  const session = await requireSession();
  await prisma.friendRequest.delete({
    where: { id: requestId },
  });
  revalidatePath("/profile", "layout");  
}

/**
 * Cancels a friend request that was previously sent to another user.
 *
 * @param {string} receiverId - The user ID of the recipient
 * @returns {Promise<void>}
 */
export async function cancelSentRequest(receiverId: string) {
  const session = await requireSession();
  await prisma.friendRequest.deleteMany({
    where: {
      senderId: session.user.id,
      receiverId: receiverId,
      status: PrismaFriendStatus.PENDING
    }
  });
  revalidatePath("/profile", "layout");
}

/**
 * Removes an existing accepted friendship between two users.
 *
 * @param {string} friendId - The user ID of the friend to remove
 * @returns {Promise<void>}
 */
export async function removeFriend(friendId: string) {
  const session = await requireSession();
  await prisma.friendRequest.deleteMany({
    where: {
      status: PrismaFriendStatus.ACCEPTED,
      OR: [
        { senderId: session.user.id, receiverId: friendId },
        { senderId: friendId, receiverId: session.user.id },
      ],
    },
  });
  revalidatePath("/profile", "layout");
}