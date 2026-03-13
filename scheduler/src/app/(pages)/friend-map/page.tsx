import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { FriendMap } from "@/src/components/friend-map/map";

export default async function FriendMapPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Not authenticated");

  // Get user's friends (accepted friend requests)
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
        },
      },
    },
  });

  // Process friends data
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

      <FriendMap friends={friendData} />
    </main>
  );
}