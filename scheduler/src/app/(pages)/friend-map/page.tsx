/**
 * FriendMapPage — Server Component
 *
 * Fetches the current user's accepted friends from the database and renders
 * them on an interactive world map. All data fetching happens server-side
 * before the page is sent to the client.
 *
 * @throws {Error} "Not authenticated" if no valid session exists.
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FriendMap } from "@/components/friend-map/map";

export default async function FriendMapPage() {
  // Verify the user is logged in — throws if no session exists
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");

  /**
   * Fetch all accepted friend requests where the current user is either
   * the sender or the receiver. Eagerly loads both profiles to avoid
   * separate queries, selecting only the fields needed for the map.
   */
  const friends = await prisma.friendRequest.findMany({
    where: {
      OR: [
        { senderId: session.user.id, status: "ACCEPTED" },
        { receiverId: session.user.id, status: "ACCEPTED" },
      ],
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          fname: true,
          lname: true,
          city: true,
          country: true,
          location: true,
          pfp: true,
          progress: {
            select: {
              equippedAvatar: true,
            },
          },
        },
      },
      receiver: {
        select: {
          id: true,
          username: true,
          fname: true,
          lname: true,
          city: true,
          country: true,
          location: true,
          pfp: true,
          progress: {
            select: {
              equippedAvatar: true,
            },
          },
        },
      },
    },
  });

  /**
   * Normalise raw friend request rows into a consistent Friend shape.
   * Determines which side of the request is the friend (not the current user),
   * then builds the object expected by <FriendMap>. Name falls back to
   * username if first/last name are not set. Location is null if the friend
   * has not shared their position.
   */
  const friendData = friends.map((request) => {
    const friend = request.senderId === session.user.id ? request.receiver : request.sender;
    return {
      id: friend.id,
      username: friend.username,
      name: friend.fname && friend.lname ? `${friend.fname} ${friend.lname}` : friend.username,
      city: friend.city,
      country: friend.country,
      location: friend.location as { lat: number; lng: number } | null,
      pfp: friend.pfp,
      equippedAvatar: friend.progress?.equippedAvatar || undefined,
    };
  });

  return (
    <main className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Friends Map</h1>
          <p className="text-sm text-gray-500 mt-1">
            See where your friends are located around the world
          </p>
        </div>
        <a 
        href="/dashboard" 
        className="text-sm text-blue-600 font-semibold hover:underline"
        >
          ← Back to Dashboard
        </a>
      </div>
      {/* Client component — handles map rendering and geolocation */}
      <FriendMap friends={friendData} />
    </main>
  );
}