import { prisma } from "lib/prisma";

//types
export type FriendUser = {
  id: string;
  username: string;
  fname: string | null;
  lname: string | null;
  pfp: string | null;
};

export type FriendStatus =
  | "ME"
  | "FRIENDS"
  | "REQUEST_SENT"
  | "REQUEST_RECEIVED"
  | "NONE";

const FRIEND_USER_SELECT = {
  id: true,
  username: true,
  fname: true,
  lname: true,
  pfp: true,
} as const;

//searching up users
/**
 * Fetches a full user record by email, including tasks, progress, and friend requests
 * @param {string} email - The email address to look up
 * @return {Promise<object | null>} - Full user object or null if not found
 */
export async function fetchUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
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
        select: { points: true, level: true, experience: true },
      },
      tasks: {
        select: { completed: true, completedAt: true },
      },
      receivedRequests: {
        where: { status: "PENDING" },
        select: {
          id: true,
          sender: { select: FRIEND_USER_SELECT },
        },
      },
      sentRequests: {
        where: { status: "ACCEPTED" },
        select: {
          id: true,
          receiver: { select: FRIEND_USER_SELECT },
        },
      },
    },
  });
}

/**
 * Fetches a public user record by username, including tasks and progress
 * @param {string} username - The username to look up
 * @return {Promise<object | null>} - Public user object or null if not found
 */
export async function fetchUserByUsername(username: string) {
  return prisma.user.findUnique({
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
      progress: {
        select: { points: true, level: true, experience: true },
      },
      tasks: {
        select: { completed: true, completedAt: true },
      },
    },
  });
}

/**
 * Fetches only the username for a given email address
 * Used to check own-profile redirects without exposing full user data
 * @param {string} email - The email address to look up
 * @return {Promise<string | null>} - Username string or null if not found
 */
export async function fetchUsernameByEmail(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { username: true },
  });
  return user?.username ?? null;
}

//friends
/**
 * Counts the total number of accepted friendships for a user
 * @param {string} userId - The database ID of the user
 * @return {Promise<number>} - Total number of accepted friends
 */
export async function fetchFriendCount(userId: string): Promise<number> {
  return prisma.friendRequest.count({
    where: {
      status: "ACCEPTED",
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
  });
}

/**
 * Fetches all accepted friends for a user from both directions of the relationship
 * @param {string} userId - The database ID of the user
 * @return {Promise<FriendUser[]>} - Array of friend user objects
 */
export async function fetchFriends(userId: string): Promise<FriendUser[]> {
  const [sent, received] = await Promise.all([
    prisma.friendRequest.findMany({
      where: { senderId: userId, status: "ACCEPTED" },
      select: { receiver: { select: FRIEND_USER_SELECT } },
    }),
    prisma.friendRequest.findMany({
      where: { receiverId: userId, status: "ACCEPTED" },
      select: { sender: { select: FRIEND_USER_SELECT } },
    }),
  ]);

  return [
    ...sent.map((r) => r.receiver),
    ...received.map((r) => r.sender),
  ];
}

/**
 * Determines the friendship status between two users
 * @param {string} viewerUserId - The ID of the user viewing the profile
 * @param {string} targetUserId - The ID of the user being viewed
 * @return {Promise<{ status: FriendStatus; requestId?: string }>} - Status and optional request ID
 */
export async function fetchFriendStatus(
  viewerUserId: string,
  targetUserId: string
): Promise<{ status: FriendStatus; requestId?: string }> {
  const [sent, received] = await Promise.all([
    prisma.friendRequest.findFirst({
      where: { senderId: viewerUserId, receiverId: targetUserId },
    }),
    prisma.friendRequest.findFirst({
      where: { senderId: targetUserId, receiverId: viewerUserId },
    }),
  ]);

  if (sent?.status === "ACCEPTED" || received?.status === "ACCEPTED") {
    return { status: "FRIENDS" };
  }
  if (sent?.status === "PENDING") {
    return { status: "REQUEST_SENT" };
  }
  if (received?.status === "PENDING") {
    return { status: "REQUEST_RECEIVED", requestId: received.id };
  }
  return { status: "NONE" };
}

//task stats
/**
 * Computes completion statistics from an array of task records
 * @param {{ completed: boolean }[]} tasks - Array of task objects with completion status
 * @return {{ completedTasks: number, totalTasks: number, completionRate: number }} - Computed stats
 */
export function computeTaskStats(tasks: { completed: boolean }[]) {
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  return { completedTasks, totalTasks, completionRate };
}