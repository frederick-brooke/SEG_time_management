/**
 * User search API route
 * Returns the authenticated user's accepted friends list
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { prisma } from "lib/prisma";

/**
 * GET /api/user/search
 *
 * Fetches all accepted friend relationships for the current user
 * and returns the "other user" in each friendship.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const friendRequests = await prisma.friendRequest.findMany({
    where: {
      OR: [
        { senderId: session.user.id, status: "ACCEPTED" },
        { receiverId: session.user.id, status: "ACCEPTED" },
      ],
    },
    include: {
      sender: { select: { id: true, username: true, fname: true, lname: true, pfp: true } },
      receiver: { select: { id: true, username: true, fname: true, lname: true, pfp: true } },
    },
  });

  // Extract the other person from each friend request
  const friends = friendRequests.map((fr) =>
    fr.senderId === session.user.id ? fr.receiver : fr.sender
  );

  return NextResponse.json(friends);
}