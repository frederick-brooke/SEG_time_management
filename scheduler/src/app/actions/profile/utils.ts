/**
 * Utility helpers
 *
 * Shared authentication and social graph utilities such as session validation
 * and friendship counting logic.
 */

import { prisma } from "lib/prisma";
import { FriendStatus as PrismaFriendStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";

/**
 * Retrieves the current session and securely throws if the user is not authenticated.
 * @return {Promise<any>} The authenticated session object.
 * @throws {Error} If no valid session exists.
 */
export async function requireSession() {
  const session = await getServerSession(authOptions);
  
  // Guard against missing session or missing user ID
  if (!session?.user?.email || !session?.user?.id) {
    throw new Error("Unauthorized");
  }
  
  return session;
}

/**
 * Counts accepted friendships for a user in both directions.
 * @param {string} userId - The database ID of the user to count friends for.
 * @return {Promise<number>} The total accepted friend count.
 */
export async function countFriends(userId: string): Promise<number> {
  return prisma.friendRequest.count({
    where: {
      status: PrismaFriendStatus.ACCEPTED,
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
  });
}