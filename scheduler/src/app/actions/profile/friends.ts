'use server';

import { prisma } from "lib/prisma";
import { FriendStatus as PrismaFriendStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireSession } from "./utils";

export async function sendFriendRequest(receiverId: string) {
  const session = await requireSession();
  await prisma.friendRequest.create({
    data: { senderId: session.user.id, receiverId, status: PrismaFriendStatus.PENDING },
  });
  revalidatePath("/profile");
}

export async function acceptFriendRequest(requestId: string) {
  const session = await requireSession();
  await prisma.friendRequest.update({
    where: { id: requestId, receiverId: session.user.id },
    data: { status: PrismaFriendStatus.ACCEPTED },
  });
  revalidatePath("/profile");
}

export async function declineFriendRequest(requestId: string) {
  const session = await requireSession();
  await prisma.friendRequest.delete({
    where: { id: requestId, receiverId: session.user.id },
  });
  revalidatePath("/profile");
}

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