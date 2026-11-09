import { v4 as uuidv4 } from "uuid";
import { config } from "../config";
import {
  INotificationRecord,
  inMemoryNotifications,
  NotificationRecordModel,
  NotificationType,
} from "../models/NotificationRecord";
import { logger } from "../utils/logger";

export class NotificationService {
  /**
   * Creates and dispatches a user notification
   */
  async createNotification(
    userId: string,
    title: string,
    body: string,
    type: NotificationType = "system_announcement",
    metadata?: Record<string, any>
  ): Promise<any> {
    const notificationId = uuidv4();
    const doc = {
      notificationId,
      userId,
      title,
      body,
      type,
      isRead: false,
      metadata: metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (config.enableMongodb) {
      await NotificationRecordModel.create(doc);
    } else {
      inMemoryNotifications.set(notificationId, doc);
    }

    logger.info(`Notification dispatched to user ${userId}: [${type}] ${title}`);
    return doc;
  }

  /**
   * Retrieves notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number }
  ): Promise<any[]> {
    const limit = Math.min(100, Math.max(1, options?.limit || 30));

    if (config.enableMongodb) {
      const filter: any = { userId };
      if (options?.unreadOnly) {
        filter.isRead = false;
      }
      return await NotificationRecordModel.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit);
    }

    let list = Array.from(inMemoryNotifications.values()).filter((n) => n.userId === userId);
    if (options?.unreadOnly) {
      list = list.filter((n) => !n.isRead);
    }

    return list
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * Marks a specific notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    if (config.enableMongodb) {
      const res = await NotificationRecordModel.updateOne(
        { notificationId, userId },
        { isRead: true }
      );
      return res.modifiedCount > 0;
    }

    const n = inMemoryNotifications.get(notificationId);
    if (n && n.userId === userId) {
      n.isRead = true;
      n.updatedAt = new Date();
      inMemoryNotifications.set(notificationId, n);
      return true;
    }
    return false;
  }

  /**
   * Marks all unread notifications for a user as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    if (config.enableMongodb) {
      const res = await NotificationRecordModel.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );
      return res.modifiedCount;
    }

    let count = 0;
    for (const [id, n] of inMemoryNotifications.entries()) {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        n.updatedAt = new Date();
        inMemoryNotifications.set(id, n);
        count++;
      }
    }
    return count;
  }

  clearInMemoryNotifications() {
    inMemoryNotifications.clear();
  }
}

export const notificationService = new NotificationService();
