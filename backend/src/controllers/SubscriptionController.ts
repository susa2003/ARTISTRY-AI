import { Request, Response } from "express";
import { subscriptionService } from "../services/SubscriptionService";
import { sendError, sendSuccess } from "../utils/response";

export class SubscriptionController {
  static async getPlans(req: Request, res: Response) {
    const catalog = subscriptionService.getPlansCatalog();
    return sendSuccess(res, catalog);
  }

  static async getUserSubscription(req: Request, res: Response) {
    if (!req.user?.userId) {
      return sendError(res, 401, "UNAUTHORIZED", "Authentication required");
    }
    const sub = await subscriptionService.getUserSubscription(req.user.userId);
    return sendSuccess(res, sub);
  }

  static async cancelSubscription(req: Request, res: Response) {
    if (!req.user?.userId) {
      return sendError(res, 401, "UNAUTHORIZED", "Authentication required");
    }
    try {
      await subscriptionService.cancelSubscription(req.user.userId);
      return sendSuccess(
        res,
        { scheduledCancellation: true },
        { message: "Subscription will not renew at the end of the current billing cycle." }
      );
    } catch (err: any) {
      return sendError(res, 400, "CANCELLATION_FAILED", err.message || "Failed to cancel subscription");
    }
  }

  static async restorePurchases(req: Request, res: Response) {
    if (!req.user?.userId) {
      return sendError(res, 401, "UNAUTHORIZED", "Authentication required");
    }
    const restored = await subscriptionService.restorePurchases(req.user.userId);
    return sendSuccess(res, restored, { message: "Purchases and entitlements restored successfully." });
  }
}
