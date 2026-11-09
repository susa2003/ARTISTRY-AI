import { Request, Response } from "express";
import { notificationService } from "../services/NotificationService";
import { sendError, sendSuccess } from "../utils/response";

export class NotificationController {
  /**
   * GET /api/v1/notifications
   */
  static async getNotifications(req: Request, res: Response) {
    if (!req.user || !req.user.userId) {
      return sendError(res, 401, "UNAUTHORIZED", "Authentication required");
    }

    try {
      const unreadOnly = req.query.unreadOnly === "true";
      const limit = req.query.limit ? Number(req.query.limit) : 30;

      const notifications = await notificationService.getUserNotifications(req.user.userId, {
        unreadOnly,
        limit,
      });

      const unread = notifications.filter((n) => !n.isRead).length;

      return sendSuccess(res, {
        notifications,
        unreadCount: unread,
      });
    } catch (err: any) {
      return sendError(res, 500, "NOTIFICATION_FETCH_FAILED", err.message);
    }
  }

  /**
   * POST /api/v1/notifications/:id/read
   */
  static async markAsRead(req: Request, res: Response) {
    if (!req.user || !req.user.userId) {
      return sendError(res, 401, "UNAUTHORIZED", "Authentication required");
    }

    try {
      const notificationId = String(req.params.id);
      const success = await notificationService.markAsRead(req.user.userId, notificationId);
      return sendSuccess(res, { success, notificationId });
    } catch (err: any) {
      return sendError(res, 500, "NOTIFICATION_UPDATE_FAILED", err.message);
    }
  }

  /**
   * POST /api/v1/notifications/read-all
   */
  static async markAllAsRead(req: Request, res: Response) {
    if (!req.user || !req.user.userId) {
      return sendError(res, 401, "UNAUTHORIZED", "Authentication required");
    }

    try {
      const count = await notificationService.markAllAsRead(req.user.userId);
      return sendSuccess(res, { count, message: "All notifications marked as read" });
    } catch (err: any) {
      return sendError(res, 500, "NOTIFICATION_UPDATE_FAILED", err.message);
    }
  }
}
