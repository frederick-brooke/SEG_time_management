'use server'

import { prisma } from "lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";
import { calculateStreak } from "./profile";

export async function getFriendsLeaderboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });

  if (!currentUser) return null;

  const sentRequests = await prisma.friendRequest.findMany({
    where: { senderId: currentUser.id, status: 'ACCEPTED' },
    select: { receiverId: true }
  });
  
  const receivedRequests = await prisma.friendRequest.findMany({
    where: { receiverId: currentUser.id, status: 'ACCEPTED' },
    select: { senderId: true }
  });

  const friendIds = [
    ...sentRequests.map(req => req.receiverId),
    ...receivedRequests.map(req => req.senderId),
    currentUser.id 
  ];

  const users = await prisma.user.findMany({
    where: { 
      id: { in: friendIds },
      isDeleted: false
    },
    select: {
      id: true,
      username: true,
      fname: true,
      lname: true,
      pfp: true,
      tasks: { select: { completed: true, duration: true } }
    }
  });

  const leaderboard = await Promise.all(users.map(async (user) => {
    const totalTasks = user.tasks.length;
    const completedTasksList = user.tasks.filter(t => t.completed);
    const completedTasksCount = completedTasksList.length;

    // Completion Rate Math
    const completionRate = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

    // Focus Time Math
    const totalMinutes = completedTasksList.reduce((sum, task) => sum + (task.duration || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const focusTimeFormatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    const streak = await calculateStreak(user.id);
    
    return {
      id: user.id,
      username: user.username,
      name: `${user.fname || user.username} ${user.lname || ''}`.trim(),
      pfp: user.pfp,
      streak,
      completionRate,
      focusTime: focusTimeFormatted,
      focusTimeRaw: totalMinutes, // Used for sorting
      isCurrentUser: user.id === currentUser.id
    };
  }));

  // Sort by Streak highest, then by Focus Time highest
  leaderboard.sort((a, b) => {
    if (b.streak !== a.streak) return b.streak - a.streak;
    return b.focusTimeRaw - a.focusTimeRaw;
  });

  return leaderboard;
}