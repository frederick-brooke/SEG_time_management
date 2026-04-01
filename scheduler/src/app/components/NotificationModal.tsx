"use client";

/**
 * NotificationModal
 *
 * Displays a modal UI for viewing, dismissing, and managing user notifications.
 * Only fetches notifications when the user is authenticated and the modal is open.
 */

import React, { useState, useEffect, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info, XCircle, Trash2 } from "lucide-react";
import { NotificationType } from "@prisma/client";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../actions/notifications";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";

interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead?: boolean;
  link?: string;
  createdAt?: Date;
  expiresAt?: Date;
}

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
  [NotificationType.SUCCESS]: <CheckCircle className="w-5 h-5" />,
  [NotificationType.ERROR]:   <XCircle className="w-5 h-5" />,
  [NotificationType.WARNING]: <AlertCircle className="w-5 h-5" />,
  [NotificationType.INFO]:    <Info className="w-5 h-5" />,
};

const NOTIFICATION_CLASSES: Record<NotificationType, string> = {
  [NotificationType.SUCCESS]: "lunar-item-success",
  [NotificationType.ERROR]:   "lunar-item-error",
  [NotificationType.WARNING]: "lunar-item-warning",
  [NotificationType.INFO]:    "lunar-item-info",
};

/**
 * Formats a timestamp into a human-readable relative time string.
 *
 * @param {Date} timestamp - The date to format
 * @returns {string} A relative time string such as "just now", "5m ago", or a locale date
 */
function formatTime(timestamp: Date): string {
  const diffMins = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
  if (diffMins < 1)    return "just now";
  if (diffMins < 60)   return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Renders a single notification row with icon, content, and dismiss button.
 *
 * @param {{ notification: Notification; onDismiss: (id: string) => void }} props
 * @returns {JSX.Element} A styled notification row
 */
function NotificationRow({ notification, onDismiss }: {
  notification: Notification;
  onDismiss: (id: string) => void;
}) {
  return (
    <div className={`p-4 border-b border-white/5 flex items-start gap-3 transition-colors hover:bg-white/5 ${NOTIFICATION_CLASSES[notification.type]}`}>
      <div className="flex-shrink-0 mt-1">
        {NOTIFICATION_ICONS[notification.type]}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="lunar-label !text-white !text-[11px]">{notification.title}</h3>
        <p className="text-xs text-white/60 mt-1">{notification.message}</p>
        <span className="lunar-label !text-[9px] !opacity-40 mt-1">
          {formatTime(notification.createdAt)}
        </span>
      </div>
      <Button
        onClick={() => onDismiss(notification.id)}
        className="flex-shrink-0 p-2 hover:bg-gray-200 rounded transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4 text-gray-400" />
      </Button>
    </div>
  );
}

/**
 * Renders an empty state with a refresh button when there are no notifications.
 *
 * @param {{ onRefresh: () => void; isRefreshing: boolean }} props
 * @returns {JSX.Element} The empty state element
 */
function EmptyState({ onRefresh, isRefreshing }: {
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <CheckCircle className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-gray-600 font-medium">No notifications</p>
      <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
      <Button
        onClick={onRefresh}
        className={`mt-6 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
          isRefreshing ? "bg-blue-800" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        Refresh
      </Button>
    </div>
  );
}

/**
 * Displays a modal for viewing, dismissing, and clearing user notifications.
 * Fetches notifications only when the user is authenticated and the modal is open.
 *
 * @param {{ handleShowModal: () => void; isOpen: boolean }} props
 * @returns {JSX.Element} The notification modal element
 */
const NotificationModal = ({
  handleShowModal,
  isOpen,
}: {
  handleShowModal: () => void;
  isOpen: boolean;
}) => {
  const { status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isRefreshing, setIsRefreshing]   = useState(false);
  const isAuthenticated                   = status === "authenticated";

  const fetchNotifications = useCallback(async () => {
    const data = await getNotifications();
    if (!data.error && data.notifications) {
      setNotifications(data.notifications);
    }
  }, []);

  const handleDismiss = (id: string) => {
    markNotificationAsRead(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    markAllNotificationsAsRead();
    setNotifications([]);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) fetchNotifications();
  }, [isOpen, isAuthenticated, fetchNotifications]);

  return (
    <div
      className={`fixed inset-0 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xl z-[9999] ${!isOpen && "hidden"}`}
      onClick={handleShowModal}
    >
      <style jsx>{`
        .notification-scroll::-webkit-scrollbar { width: 8px; }
        .notification-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .notification-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .notification-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="lunar-glass max-w-2xl w-full max-h-[80vh] flex flex-col"
      >
        <div className="border-b border-white/5 p-6 flex items-center justify-between">
          <div>
            <h2 className="lunar-header">Notifications</h2>
            <p className="lunar-label">{notifications.length} notifications</p>
          </div>
          <Button onClick={handleShowModal} className="text-white/40 hover:text-white" aria-label="Close modal">
            <X className="w-6 h-6 text-gray-500" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto notification-scroll">
          {notifications.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onDismiss={handleDismiss}
                />
              ))}
            </div>
          ) : (
            <EmptyState onRefresh={handleRefresh} isRefreshing={isRefreshing} />
          )}
        </div>

        {notifications.length > 0 && (
          <div className="border-t border-white/10 p-4 bg-black-20 flex gap-3 justify-end rounded-b-lg">
            <Button onClick={handleClearAll} className="lunar-label">
              <Trash2 className="text-white" />
              Clear All
            </Button>
            <Button
              onClick={handleShowModal}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationModal;