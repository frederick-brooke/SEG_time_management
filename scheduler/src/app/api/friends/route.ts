/**
 * Friends API route — handles fetching friends with location data
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { fetchFriends } from "@/lib/profile-queries";

/**
 * GET /api/friends
 * Returns friends list with location data for the authenticated user
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  try {
    const friends = await fetchFriends(session.user.id);
    return NextResponse.json(friends);
  } catch (error: any) {
    console.error("Error fetching friends:", error);
    return NextResponse.json({
      message: "Failed to fetch friends",
      error: error.message
    }, { status: 500 });
  }
}