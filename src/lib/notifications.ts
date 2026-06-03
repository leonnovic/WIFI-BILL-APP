/**
 * Notification Service
 * Central notification system for in-app, email, and SMS notifications
 */

import { db } from './db'
import { getEmailService } from './email'
import { getSMSAPI } from './sms'

type NotificationType = 'info' | 'warning' | 'error' | 'success'
type NotificationChannel = 'in_app' | 'email' | 'sms' | 'all'

interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type?: NotificationType
  channel?: NotificationChannel
  sendEmail?: boolean
  sendSMS?: boolean
  emailData?: Record<string, any>
  smsData?: Record<string, any>
}

class NotificationService {
  /**
   * Create and send a notification
   */
  async notify(params: CreateNotificationParams): Promise<void> {
    const { userId, title, message, type = 'info', channel = 'in_app', sendEmail, sendSMS, emailData, smsData } = params

    // Always create in-app notification
    await db.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    })

    // Send email if requested
    if (sendEmail || channel === 'email' || channel === 'all') {
      try {
        const user = await db.user.findUnique({ where: { id: userId } })
        if (user?.email) {
          await getEmailService().sendEmail({
            to: user.email,
            subject: title,
            html: `<div style="font-family: sans-serif; padding: 20px;"><h2>${title}</h2><p>${message}</p></div>`,
          })
        }
      } catch (error) {
        console.error('Failed to send notification email:', error)
      }
    }

    // Send SMS if requested
    if (sendSMS || channel === 'sms' || channel === 'all') {
      try {
        const user = await db.user.findUnique({ where: { id: userId } })
        if (user?.phone) {
          await getSMSAPI().sendSMS({
            to: user.phone,
            message: `${title}: ${message}`,
          })
        }
      } catch (error) {
        console.error('Failed to send notification SMS:', error)
      }
    }
  }

  /**
   * Get unread notifications for a user
   */
  async getUnread(userId: string) {
    return db.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
  }

  /**
   * Get all notifications for a user
   */
  async getAll(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit
    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.notification.count({ where: { userId } }),
    ])

    return { notifications, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    return db.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    return db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
  }

  /**
   * Delete old notifications (cleanup)
   */
  async cleanup(daysOld: number = 90) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - daysOld)

    return db.notification.deleteMany({
      where: { createdAt: { lt: cutoff } },
    })
  }
}

// Singleton
let notificationInstance: NotificationService | null = null

export function getNotificationService(): NotificationService {
  if (!notificationInstance) {
    notificationInstance = new NotificationService()
  }
  return notificationInstance
}

export { NotificationService }
export type { CreateNotificationParams, NotificationType }
