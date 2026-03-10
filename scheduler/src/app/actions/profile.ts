'use server'

import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { revalidatePath } from "next/cache";
import { consumeStreakShield } from "@/src/lib/points";

async function getFriendCount(userId: string) {
  return await prisma.friendRequest.count({
    where: {
      status: 'ACCEPTED',
      OR: [
        { senderId: userId },
        { receiverId: userId }
      ]
    }
  });
}

export async function calculateStreak(userId: string): Promise<number> {
  const tasks = await prisma.task.findMany({
    where: { userId, completed: true, completedAt: { not: null } },
    orderBy: { completedAt: 'desc' },
    select: { completedAt: true }
  });

  if (tasks.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completionDates = tasks
    .map(task => {
      if (!task.completedAt) return null;
      const date = new Date(task.completedAt);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
    .filter((date): date is number => date !== null);

  const uniqueDates = [...new Set(completionDates)].sort((a, b) => b - a);
  if (uniqueDates.length === 0) return 0;

  const mostRecentDate = new Date(uniqueDates[0]);
  const daysDiff = Math.floor((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));

  // If missed more than 1 day, streak is broken — no shield can help
  if (daysDiff > 2) return 0;

  // If missed exactly 1 day, try to consume a streak shield
  if (daysDiff === 2) {
    const shieldUsed = await consumeStreakShield(userId);
    if (!shieldUsed) return 0; // No shield available, streak broken
    // Shield consumed — continue counting as if yesterday was completed
  }

  let streak = 0;
  let expectedDate = today.getTime();

  for (const dateTimestamp of uniqueDates) {
    const diff = Math.floor((expectedDate - dateTimestamp) / (1000 * 60 * 60 * 24));
    if (diff === 0 || diff === 1) {
      streak++;
      expectedDate = dateTimestamp - (1000 * 60 * 60 * 24);
    } else {
      break;
    }
  }

  return streak;
}

export async function getMyProfile() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return null;

  const [
    progress,
    tasks,
    pendingReceivedRequests,
    sentAcceptedRequests,
    receivedAcceptedRequests,
    friendCount,
  ] = await Promise.all([
    prisma.userProgress.findUnique({
      where: { userId: user.id },
      select: {
        points: true,
        level: true,
        experience: true,
      },
    }),
    prisma.task.findMany({
      where: { userId: user.id },
      select: {
        completed: true,
        completedAt: true,
      },
    }),
    prisma.friendRequest.findMany({
      where: {
        receiverId: user.id,
        status: "PENDING",
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fname: true,
            lname: true,
            pfp: true,
          },
        },
      },
    }),
    prisma.friendRequest.findMany({
      where: {
        senderId: user.id,
        status: "ACCEPTED",
      },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            fname: true,
            lname: true,
            pfp: true,
          },
        },
      },
    }),
    prisma.friendRequest.findMany({
      where: {
        receiverId: user.id,
        status: "ACCEPTED",
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fname: true,
            lname: true,
            pfp: true,
          },
        },
      },
    }),
    getFriendCount(user.id),
  ]);

  const friends = [
    ...sentAcceptedRequests.map((req) => req.receiver),
    ...receivedAcceptedRequests.map((req) => req.sender),
  ];

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const streak = await calculateStreak(user.id);

  return {
    ...user,
    progress: progress ?? null,
    receivedRequests: pendingReceivedRequests,
    friends,
    stats: { completedTasks, totalTasks, completionRate, friendCount, streak },
    friendStatus: "ME",
  };
}

export async function getProfile(username: string) {
  const session = await getServerSession(authOptions);
  
  const currentUserId = session?.user?.id || "UNAUTHENTICATED";

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      fname: true,
      lname: true,
      email: true,
      bio: true,
      pfp: true,
      createdAt: true,
      tasks: { select: { completed: true, completedAt: true } },
      sentRequests: { where: { receiverId: currentUserId } },
      receivedRequests: { where: { senderId: currentUserId } }
    }
  });

  if (!user) return null;

  const friendCount = await getFriendCount(user.id);
  
  const sentFriendRequests = await prisma.friendRequest.findMany({
    where: {
      senderId: user.id,
      status: 'ACCEPTED'
    },
    include: {
      receiver: { 
        select: { id: true, username: true, fname: true, lname: true, pfp: true } 
      }
    }
  });

  const receivedFriendRequests = await prisma.friendRequest.findMany({
    where: {
      receiverId: user.id,
      status: 'ACCEPTED'
    },
    include: {
      sender: { 
        select: { id: true, username: true, fname: true, lname: true, pfp: true } 
      }
    }
  });

  const friends = [
    ...sentFriendRequests.map(req => req.receiver),
    ...receivedFriendRequests.map(req => req.sender)
  ];

  const completedTasks = user.tasks.filter(t => t.completed).length;
  const totalTasks = user.tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const streak = await calculateStreak(user.id);
  let friendStatus = "NONE"; 
  const sent = user.receivedRequests[0]; 
  const received = user.sentRequests[0]; 

  if (sent?.status === 'ACCEPTED' || received?.status === 'ACCEPTED') {
    friendStatus = "FRIENDS";
  } else if (sent?.status === 'PENDING') {
    friendStatus = "REQUEST_SENT";
  } else if (received?.status === 'PENDING') {
    friendStatus = "REQUEST_RECEIVED";
  }

  return {
    ...user,
    friends,
    stats: { completedTasks, totalTasks, completionRate, friendCount, streak },
    friendStatus,
    requestId: received?.id 
  };
}

// OUTDATED
//
// export async function updateProfile(formData: FormData) {
//   const session = await getServerSession(authOptions);
//   if (!session?.user?.email) throw new Error("Unauthorized");

//   await prisma.user.update({
//     where: { email: session.user.email },
//     data: {
//       fname: formData.get("fname") as string,
//       lname: formData.get("lname") as string,
//       bio: formData.get("bio") as string,
//     },
//   });
//   revalidatePath("/profile");
// }

export async function sendFriendRequest(targetUserId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.id === targetUserId) return; 

  const existing = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId: session.user.id, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: session.user.id }
      ]
    }
  });

  if (existing) return;

  await prisma.friendRequest.create({
    data: {
      senderId: session.user.id,
      receiverId: targetUserId,
      status: 'PENDING'
    }
  });
  revalidatePath("/profile");
}

export async function acceptFriendRequest(requestId: string) {
  await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: 'ACCEPTED' }
  });
  revalidatePath("/profile");
}

export async function rejectFriendRequest(requestId: string) {
  await prisma.friendRequest.delete({
    where: { id: requestId }
  });
  revalidatePath("/profile");
}

export async function removeFriend(friendUserId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.friendRequest.deleteMany({
    where: {
      status: 'ACCEPTED',
      OR: [
        { senderId: session.user.id, receiverId: friendUserId },
        { senderId: friendUserId, receiverId: session.user.id }
      ]
    }
  });
  
  revalidatePath("/profile");
}

export async function cancelFriendRequest(requestUserId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.friendRequest.deleteMany({
    where: {
      senderId: session.user.id,
      receiverId: requestUserId,
      status: 'PENDING'
    }
  });
  
  revalidatePath("/profile");
}

export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

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

  // If city and country are provided, attempt to geocode them into coordinates.
  // Always update the location when the user supplies city/country: if geocoding
  // fails or returns no result, we explicitly clear the stored location so we
  // don't keep stale coordinates for a new textual location.
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