import { prisma } from './prisma'
import { NotificationType, NotificationMethod } from '@prisma/client'

export interface NotificationMetadata {
  box_id?: string
  shipment_id?: string
  item_id?: string
  picker_link_uuid?: string
  [key: string]: unknown
}

export interface CreateNotificationOptions {
  userId: string
  type: NotificationType
  title: string
  message: string
  method?: NotificationMethod
  metadata?: NotificationMetadata
  batchId?: string
  expiresAt?: Date
}

export interface BatchNotificationOptions {
  userIds: string[]
  type: NotificationType
  title: string
  message: string
  method?: NotificationMethod
  metadata?: NotificationMetadata
  batchWindowMinutes?: number
}

class NotificationSystem {
  private static instance: NotificationSystem

  static getInstance(): NotificationSystem {
    if (!NotificationSystem.instance) {
      NotificationSystem.instance = new NotificationSystem()
    }
    return NotificationSystem.instance
  }

  async createNotification(options: CreateNotificationOptions): Promise<void> {
    const { userId, type, title, message, method = NotificationMethod.IN_APP, metadata, batchId, expiresAt } = options

    try {
      await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          method,
          metadata: (metadata || {}) as any,
          batchId,
          expiresAt
        }
      })

      await this.processRealtimeNotification(userId, type, title, message, method, metadata)
    } catch (error) {
      console.error('Failed to create notification:', error)
    }
  }

  async createBatchNotifications(options: BatchNotificationOptions): Promise<void> {
    const { userIds, type, title, message, method = NotificationMethod.IN_APP, metadata, batchWindowMinutes = 15 } = options
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + batchWindowMinutes)

    const notifications = userIds.map(userId => ({
      userId,
      type,
      title,
      message,
      method,
      metadata: (metadata || {}) as any,
      batchId,
      expiresAt
    }))

    try {
      await prisma.notification.createMany({
        data: notifications
      })

      await this.processBatchRealtimeNotifications(userIds, type, title, message, method, metadata)
    } catch (error) {
      console.error('Failed to create batch notifications:', error)
    }
  }

  async getUserNotifications(userId: string, unreadOnly: boolean = false, limit: number = 50) {
    const where: { userId: string; isRead?: boolean } = { userId }
    if (unreadOnly) {
      where.isRead = false
    }

    return await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      })
    } catch (error) {
      console.error('Failed to get unread count:', error)
      return 0
    }
  }

  async cleanupOldNotifications(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    try {
      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          isRead: true
        }
      })

      console.log(`Cleaned up ${result.count} old notifications`)
    } catch (error) {
      console.error('Failed to cleanup old notifications:', error)
    }
  }

  async getNotificationSettings(userId: string) {
    try {
      return await prisma.notificationSetting.findMany({
        where: { userId }
      })
    } catch (error) {
      console.error('Failed to get notification settings:', error)
      return []
    }
  }

  async updateNotificationSettings(
    userId: string,
    type: NotificationType,
    settings: {
      enabled?: boolean
      method?: NotificationMethod
      emailEnabled?: boolean
      realTimeEnabled?: boolean
      batchEnabled?: boolean
      batchWindowMinutes?: number
    }
  ): Promise<void> {
    try {
      await prisma.notificationSetting.upsert({
        where: {
          userId_type: {
            userId,
            type
          }
        },
        update: settings,
        create: {
          userId,
          type,
          ...settings
        }
      })
    } catch (error) {
      console.error('Failed to update notification settings:', error)
    }
  }

  async notifyPackersOnBoxConcluded(boxId: string, shipmentId: string): Promise<void> {
    try {
      const box = await prisma.box.findUnique({
        where: { id: boxId },
        include: {
          shipment: {
            include: {
              pickerLinks: {
                where: { isActive: true },
                include: { packer: true }
              }
            }
          }
        }
      })

      if (!box) return

      const packerIds = box.shipment.pickerLinks
        .filter(link => link.packerId)
        .map(link => link.packerId!)

      if (packerIds.length === 0) return

      await this.createBatchNotifications({
        userIds: packerIds,
        type: NotificationType.BOX_CONCLUDED,
        title: `Box Concluded: ${box.name}`,
        message: `Box "${box.name}" in shipment "${box.shipment.name}" has been concluded.`,
        metadata: {
          box_id: boxId,
          shipment_id: shipmentId
        }
      })
    } catch (error) {
      console.error('Failed to notify packers on box concluded:', error)
    }
  }

  async notifyPackersOnShipmentCompleted(shipmentId: string): Promise<void> {
    try {
      const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
        include: {
          pickerLinks: {
            where: { isActive: true },
            include: { packer: true }
          }
        }
      })

      if (!shipment) return

      const packerIds = shipment.pickerLinks
        .filter(link => link.packerId)
        .map(link => link.packerId!)

      if (packerIds.length === 0) return

      await this.createBatchNotifications({
        userIds: packerIds,
        type: NotificationType.SHIPMENT_COMPLETED,
        title: `Shipment Completed: ${shipment.name}`,
        message: `Shipment "${shipment.name}" has been completed successfully.`,
        metadata: {
          shipment_id: shipmentId
        }
      })
    } catch (error) {
      console.error('Failed to notify packers on shipment completed:', error)
    }
  }

  async notifyPackersOnShipmentCancelled(shipmentId: string): Promise<void> {
    try {
      const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
        include: {
          pickerLinks: {
            where: { isActive: true },
            include: { packer: true }
          }
        }
      })

      if (!shipment) return

      const packerIds = shipment.pickerLinks
        .filter(link => link.packerId)
        .map(link => link.packerId!)

      if (packerIds.length === 0) return

      await this.createBatchNotifications({
        userIds: packerIds,
        type: NotificationType.SHIPMENT_CANCELLED,
        title: `Shipment Cancelled: ${shipment.name}`,
        message: `Shipment "${shipment.name}" has been cancelled.`,
        metadata: {
          shipment_id: shipmentId
        }
      })
    } catch (error) {
      console.error('Failed to notify packers on shipment cancelled:', error)
    }
  }

  async notifyPickerAssigned(pickerLinkUuid: string, packerId: string): Promise<void> {
    try {
      const pickerLink = await prisma.pickerLink.findUnique({
        where: { uuid: pickerLinkUuid },
        include: {
          shipment: true,
          packer: true
        }
      })

      if (!pickerLink || !pickerLink.packer) return

      await this.createNotification({
        userId: packerId,
        type: NotificationType.PICKER_ASSIGNED,
        title: `Picker Link Assigned`,
        message: `You have been assigned to shipment "${pickerLink.shipment.name}"`,
        method: NotificationMethod.BOTH,
        metadata: {
          picker_link_uuid: pickerLinkUuid,
          shipment_id: pickerLink.shipmentId
        }
      })
    } catch (error) {
      console.error('Failed to notify picker assigned:', error)
    }
  }

  private async processRealtimeNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    method: NotificationMethod,
    metadata?: NotificationMetadata
  ): Promise<void> {
    try {
      const settings = await prisma.notificationSetting.findUnique({
        where: {
          userId_type: {
            userId,
            type
          }
        }
      })

      if (settings && !settings.enabled) {
        return
      }

      if (settings?.realTimeEnabled !== false) {
        console.log(`Real-time notification sent to user ${userId}: ${title}`)
      }

      if ((settings?.emailEnabled || method === NotificationMethod.EMAIL || method === NotificationMethod.BOTH) && settings?.emailEnabled !== false) {
        await this.sendEmailNotification(userId, title, message)
      }
    } catch (error) {
      console.error('Failed to process realtime notification:', error)
    }
  }

  private async processBatchRealtimeNotifications(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    method: NotificationMethod,
    metadata?: NotificationMetadata
  ): Promise<void> {
    for (const userId of userIds) {
      await this.processRealtimeNotification(userId, type, title, message, method, metadata)
    }
  }

  private async sendEmailNotification(
    userId: string,
    title: string,
    message: string
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      })

      if (!user) return

      console.log(`Email notification sent to ${user.email}: ${title} - ${message}`)
    } catch (error) {
      console.error('Failed to send email notification:', error)
    }
  }
}

export const notificationSystem = NotificationSystem.getInstance()

export async function notifyBoxConcluded(boxId: string, shipmentId: string) {
  await notificationSystem.notifyPackersOnBoxConcluded(boxId, shipmentId)
}

export async function notifyShipmentCompleted(shipmentId: string) {
  await notificationSystem.notifyPackersOnShipmentCompleted(shipmentId)
}

export async function notifyShipmentCancelled(shipmentId: string) {
  await notificationSystem.notifyPackersOnShipmentCancelled(shipmentId)
}

export async function notifyPickerAssigned(pickerLinkUuid: string, packerId: string) {
  await notificationSystem.notifyPickerAssigned(pickerLinkUuid, packerId)
}