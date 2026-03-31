"use server";

/**
 * Notification service
 *
 * Handles creation, retrieval, and update of user notifications,
 * including read state management and expiry filtering.
 */

import { prisma } from "lib/prisma";
import { NotificationType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";

/**
 * Fetches unread notifications for the current user.
 * Only returns notifications that are not expired (or have no expiry date).
 *
 * @param {number} [count=20] - Maximum number of notifications to return
 * @returns {Promise<{ notifications: any[] | null; error: string | null }>}
 */
export async function getNotifications(count: number = 20) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { notifications: [], error: null };
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        isRead: false,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: "desc" },
      take: count,
    });

    return { notifications, error: null };
  } catch (err) {
    console.error(err);
    return { notifications: null, error: "Failed to fetch notifications" };
  }
}

/**
 * Marks a single notification as read for the current user.
 * Ensures the notification belongs to the authenticated user before updating.
 *
 * @param {string} notificationId - The ID of the notification to mark as read
 * @returns {Promise<{ success: boolean; error: string | null }>}
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    // Ensure the notification exists and belongs to the user
    if (!notification || notification.userId !== session.user.id) {
      throw new Error("Notification not found");
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return { success: true, error: null };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to mark notifications as read" };
  }
}

/**
 * Marks all unread notifications as read for the current user.
 *
 * @returns {Promise<{ success: boolean; error: string | null }>}
 */
export async function markAllNotificationsAsRead() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    });

    return { success: true, error: null };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to mark notifications as read" };
  }
}

/**
 * Creates a new notification for a user.
 *
 * @param {string} userId - Recipient user ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message body
 * @param {NotificationType} type - Type/category of notification
 * @param {string} [link] - Optional navigation link
 * @param {Date} [expiresAt] - Optional expiration date
 * @returns {Promise<{ notification: any | null; error: string | null }>}
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  link?: string,
  expiresAt?: Date,
) {
  try {
    if (!title || !message || !type) {
      console.error(
        "Title, message and type are required to create a notification",
      );
      return {
        notification: null,
        error: "Title, message and type are required",
      };
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link: link ? link : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    console.log("Notification created:", notification);
    return { notification, error: null };
  } catch (err) {
    console.error(err);
    return { notification: null, error: "Failed to create notification" };
  }
}
