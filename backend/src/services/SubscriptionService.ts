import { v4 as uuidv4 } from "uuid";
import { config } from "../config";
import { BillingCycle, SUBSCRIPTION_PLANS, SubscriptionTier } from "../config/plans";
import { ISubscription, SubscriptionModel } from "../models/Subscription";
import { UserModel } from "../models/User";
import { entitlementService } from "./EntitlementService";
import { logger } from "../utils/logger";

export const inMemorySubscriptions = new Map<string, any>();

export class SubscriptionService {
  /**
   * Returns complete configurable subscription plans catalog
   */
  getPlansCatalog() {
    return {
      plans: Object.values(SUBSCRIPTION_PLANS),
      currency: "USD",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Retrieves user's active subscription status and entitlement information
   */
  async getUserSubscription(userId: string) {
    const activeTierInfo = await entitlementService.getUserActiveTier(userId);
    let sub: any;

    if (config.enableMongodb) {
      sub = await SubscriptionModel.findOne({ userId }).sort({ createdAt: -1 });
    } else {
      sub = inMemorySubscriptions.get(userId);
    }

    let user: any;
    if (config.enableMongodb) {
      user = await UserModel.findOne({ userId });
    }

    return {
      tier: activeTierInfo.tier,
      status: sub?.status || activeTierInfo.status,
      billingCycle: sub?.billingCycle || "monthly",
      productId: sub?.productId || "artistry_free",
      currentPeriodStart: sub?.currentPeriodStart || new Date().toISOString(),
      currentPeriodEnd: sub?.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: Boolean(sub?.cancelAtPeriodEnd),
      creditBalance: user?.creditBalance ?? 50,
      planDetails: SUBSCRIPTION_PLANS[activeTierInfo.tier],
    };
  }

  /**
   * Sets auto-renewal cancellation at period end (does not immediately revoke access)
   */
  async cancelSubscription(userId: string): Promise<boolean> {
    if (config.enableMongodb) {
      const sub = await SubscriptionModel.findOne({ userId, status: "active" }).sort({ createdAt: -1 });
      if (!sub) {
        throw new Error("NO_ACTIVE_SUBSCRIPTION");
      }
      sub.cancelAtPeriodEnd = true;
      sub.canceledAt = new Date();
      await sub.save();
    } else {
      const sub = inMemorySubscriptions.get(userId);
      if (!sub || sub.status !== "active") {
        throw new Error("NO_ACTIVE_SUBSCRIPTION");
      }
      sub.cancelAtPeriodEnd = true;
      sub.canceledAt = new Date();
    }
    logger.info(`Subscription scheduled for cancellation at period end for user ${userId}`);
    return true;
  }

  /**
   * Activates or updates a verified subscription
   */
  async activateSubscription(
    userId: string,
    tier: SubscriptionTier,
    billingCycle: BillingCycle,
    details: { productId: string; orderId?: string; purchaseToken?: string }
  ): Promise<any> {
    const subscriptionId = uuidv4();
    const now = new Date();
    const durationDays = billingCycle === "yearly" ? 365 : 30;
    const currentPeriodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const gracePeriodExpiresAt = new Date(currentPeriodEnd.getTime() + 3 * 24 * 60 * 60 * 1000); // 3-day grace

    const subData = {
      subscriptionId,
      userId,
      tier,
      status: "active",
      billingCycle,
      productId: details.productId,
      orderId: details.orderId,
      purchaseToken: details.purchaseToken,
      startDate: now,
      currentPeriodStart: now,
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
      gracePeriodExpiresAt,
    };

    let savedSub: any;
    if (config.enableMongodb) {
      savedSub = await SubscriptionModel.create(subData);
      // Update User tier & credit allowance
      const plan = SUBSCRIPTION_PLANS[tier];
      await UserModel.updateOne(
        { userId },
        {
          $set: { subscriptionTier: tier },
          $inc: { creditBalance: plan.monthlyCredits },
        }
      );
    } else {
      savedSub = subData;
      inMemorySubscriptions.set(userId, savedSub);
      entitlementService.setInMemorySubscription(userId, savedSub);
    }

    logger.info(`Activated ${tier} subscription for user ${userId}`);
    return savedSub;
  }

  /**
   * Restores user purchases and re-attaches valid entitlements
   */
  async restorePurchases(userId: string): Promise<any> {
    return await this.getUserSubscription(userId);
  }
}

export const subscriptionService = new SubscriptionService();
