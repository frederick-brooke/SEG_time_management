'use client';

import React, { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, XCircle, Trash2 } from 'lucide-react'
import { NotificationType } from '@prisma/client'
import { GET } from '../api/notifications/route'

interface Notification {
  id: string
  userId?: string
  message: string
  type: NotificationType
  isRead?: boolean
  link?: string
  createdAt?: Date
  expiresAt?: Date
  title: string
  timestamp: Date
  // id        String   @id @default(auto()) @map("_id") @db.ObjectId
  // userId    String?  @db.ObjectId
  // message   String
  // type      NotificationType
  // isRead    Boolean  @default(false)
  // link      String?  
  // createdAt DateTime @default(now())
  // expiresAt DateTime? 
}

const NotificationModal = ({ handleShowModal, isOpen }: { handleShowModal: () => void, isOpen: boolean }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    // {
    //   id: '1',
    //   type: NotificationType.SUCCESS,
    //   title: 'Profile Updated',
    //   message: 'Your profile has been successfully updated.',
    //   timestamp: new Date(Date.now() - 5 * 60000)
    // },
    // {
    //   id: '2',
    //   type: NotificationType.WARNING,
    //   title: 'Low Battery',
    //   message: 'Your device battery is running low. Please charge soon.',
    //   timestamp: new Date(Date.now() - 15 * 60000)
    // },
    // {
    //   id: '3',
    //   type: NotificationType.INFO,
    //   title: 'New Event',
    //   message: 'You have a meeting scheduled for tomorrow at 2:00 PM.',
    //   timestamp: new Date(Date.now() - 30 * 60000)
    // },
    // {
    //   id: '4',
    //   type: NotificationType.ERROR,
    //   title: 'Sync Failed',
    //   message: 'Failed to sync data. Please try again later.',
    //   timestamp: new Date(Date.now() - 1 * 3600000)
    // },
    // {
    //   id: '5',
    //   type: NotificationType.ERROR,
    //   title: 'Sync Failed',
    //   message: 'Failed to sync data. Please try again later.',
    //   timestamp: new Date(Date.now() - 1 * 3600000)
    // },
    // {
    //   id: '6',
    //   type: NotificationType.ERROR,
    //   title: 'Sync Failed',
    //   message: 'Failed to sync data. Please try again later.',
    //   timestamp: new Date(Date.now() - 1 * 3600000)
    // }
  ])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      const data = await response.json()
      setNotifications(data.notifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }


  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUCCESS:
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case NotificationType.ERROR:
        return <XCircle className="w-5 h-5 text-red-500" />
      case NotificationType.WARNING:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case NotificationType.INFO:
        return <Info className="w-5 h-5 text-blue-500" />
      default:
        return null
    }
  }

  const getNotificationBgColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUCCESS:
        return 'bg-green-50 border-green-200'
      case NotificationType.ERROR:
        return 'bg-red-50 border-red-200'
      case NotificationType.WARNING:
        return 'bg-yellow-50 border-yellow-200'
      case NotificationType.INFO:
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const formatTime = (timestamp: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return timestamp.toLocaleDateString()
  }

  const removeNotification = (id: string) => {
    setNotifications(notifications.filter(notif => notif.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  // Fetch notifications only once when the component mounts
  useEffect(() => {
    if(isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  return (
    <div
      className="w-full h-full fixed inset-0 backdrop-filter backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleShowModal}
    >
      <style jsx>{`
        .notification-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .notification-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .notification-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .notification-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
            <p className="text-sm text-gray-500 mt-1">{notifications.length} notifications</p>
          </div>
          <button
            onClick={handleShowModal}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto notification-scroll">
          {notifications.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 flex items-start gap-3 ${getNotificationBgColor(notification.type)} hover:bg-opacity-75 transition-colors`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <span className="text-xs text-gray-500 mt-2 block">{formatTime(notification.timestamp)}</span>
                  </div>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="flex-shrink-0 p-2 hover:bg-gray-200 rounded transition-colors"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No notifications</p>
              <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50 flex gap-3 justify-end rounded-b-lg">
            <button
              onClick={clearAll}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-md transition-colors inline-flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
            <button
              onClick={handleShowModal}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationModal