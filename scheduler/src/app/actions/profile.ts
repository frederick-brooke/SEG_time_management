'use server'

import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { revalidatePath } from "next/cache";

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
    where: {
      userId,
      completed: true,
      completedAt: { not: null }
    },
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

  if (daysDiff > 1) return 0;

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
    select: {
      id: true,
      username: true,
      fname: true,
      lname: true,
      email: true,
      bio: true,
      pfp: true,
      createdAt: true,
  
      progress: {
        select: {
          points: true,
          level: true,
          experience: true
        }
      },
  
      tasks: {
        select: {
          completed: true,
          completedAt: true
        }
      },
  
      receivedRequests: {
        where: { status: "PENDING" },
        select: {
          id: true,
          sender: {
            select: {
              id: true,
              username: true,
              fname: true,
              lname: true,
              pfp: true
            }
          }
        }
      },
  
      sentRequests: {   // ← add this back
        where: { status: "ACCEPTED" },
        select: {
          id: true,
          receiver: {
            select: {
              id: true,
              username: true,
              fname: true,
              lname: true,
              pfp: true
            }
          }
        }
      }
    }
  });

  if (!user) return null;

  const friendCount = await getFriendCount(user.id);
  
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
    ...user.sentRequests.map(req => req.receiver),
    ...receivedFriendRequests.map(req => req.sender)
  ];

  const completedTasks = user.tasks.filter(t => t.completed).length;
  const totalTasks = user.tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const streak = await calculateStreak(user.id);
  
  return {
    ...user,
    friends,
    stats: { completedTasks, totalTasks, completionRate, friendCount, streak },
    friendStatus: "ME"
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

export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      fname: formData.get("fname") as string,
      lname: formData.get("lname") as string,
      bio: formData.get("bio") as string,
    },
  });
  revalidatePath("/profile");
}

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