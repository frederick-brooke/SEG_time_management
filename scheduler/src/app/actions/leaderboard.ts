'use server'

import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { calculateStreak } from "./profile";

export async function getFriendsLeaderboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  // 1. Get current user
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });

  if (!currentUser) return null;

  // 2. Get all accepted friends (checking both sender and receiver)
  const sentRequests = await prisma.friendRequest.findMany({
    where: { senderId: currentUser.id, status: 'ACCEPTED' },
    select: { receiverId: true }
  });
  
  const receivedRequests = await prisma.friendRequest.findMany({
    where: { receiverId: currentUser.id, status: 'ACCEPTED' },
    select: { senderId: true }
  });

  // Combine friend IDs and add the current user's ID so they are on the board too!
  const friendIds = [
    ...sentRequests.map(req => req.receiverId),
    ...receivedRequests.map(req => req.senderId),
    currentUser.id 
  ];

  // 3. Fetch data for all these users
  const users = await prisma.user.findMany({
    where: { id: { in: friendIds } },
    select: {
      id: true,
      username: true,
      fname: true,
      lname: true,
      pfp: true,
      tasks: { select: { completed: true } }
    }
  });

  // 4. Calculate stats and streaks for everyone
  const leaderboard = await Promise.all(users.map(async (user) => {
    const completedTasks = user.tasks.filter(t => t.completed).length;
    const streak = await calculateStreak(user.id);
    
    return {
      id: user.id,
      username: user.username,
      name: `${user.fname || user.username} ${user.lname || ''}`.trim(),
      pfp: user.pfp,
      completedTasks,
      streak,
      isCurrentUser: user.id === currentUser.id
    };
  }));

  // 5. Sort the leaderboard (Let's sort by Streak first, then by Tasks Completed)
  leaderboard.sort((a, b) => {
    if (b.streak !== a.streak) return b.streak - a.streak;
    return b.completedTasks - a.completedTasks;
  });

  return leaderboard;
}