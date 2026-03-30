"use server";

import { prisma } from "lib/prisma";
import { NotificationType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "lib/auth";

// Returns the n (20 default) most recent notifications that are either non-expiring or not yet expired
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
