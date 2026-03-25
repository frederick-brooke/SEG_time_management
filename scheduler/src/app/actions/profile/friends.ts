'use server';

import { prisma } from "@/lib/prisma";
import { FriendStatus as PrismaFriendStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireSession } from "./utils";

// 1. Send a request to someone
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
  revalidatePath("/profile");
}

// 2. Accept a request someone sent you
export async function acceptFriendRequest(senderId: string) {
  const session = await requireSession();
  await prisma.friendRequest.updateMany({
    where: { 
      senderId: senderId, 
      receiverId: session.user.id,
      status: PrismaFriendStatus.PENDING
    },
    data: { status: PrismaFriendStatus.ACCEPTED },
  });
  revalidatePath("/profile");
}

// 3. Decline a request someone sent you
export async function declineFriendRequest(senderId: string) {
  const session = await requireSession();
  await prisma.friendRequest.deleteMany({
    where: { 
      senderId: senderId, 
      receiverId: session.user.id,
      status: PrismaFriendStatus.PENDING
    },
  });
  revalidatePath("/profile");
}

// 4. Cancel a request YOU sent to someone else
export async function cancelSentRequest(receiverId: string) {
  const session = await requireSession();
  await prisma.friendRequest.deleteMany({
    where: {
      senderId: session.user.id,
      receiverId: receiverId,
      status: PrismaFriendStatus.PENDING
    }
  });
  revalidatePath("/profile");
}

// 5. Remove an accepted friend
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
  revalidatePath("/profile");
}