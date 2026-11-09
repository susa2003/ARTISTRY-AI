import { config } from "../config";
import { FEATURE_ENTITLEMENT_GATES, SUBSCRIPTION_PLANS, SubscriptionTier } from "../config/plans";
import { SubscriptionModel, ISubscription } from "../models/Subscription";
import { UserModel } from "../models/User";

const inMemorySubscriptions = new Map<string, any>();

export class EntitlementService {
  /**
   * Evaluates the active subscription tier for a user with expiration & grace-period checks
   */
  async getUserActiveTier(userId: string): Promise<{
    tier: SubscriptionTier;
    status: "active" | "grace_period" | "expired";
    expiresAt?: Date;
  }> {
    // 1. Check if user is an admin or artist role (auto-granted premium)
    let user: any;
    if (config.enableMongodb) {
      user = await UserModel.findOne({ userId });
    }
    if (user?.role === "admin") {
      return { tier: "premium", status: "active" };
    }

    // 2. Fetch latest subscription record
    let sub: any;
    if (config.enableMongodb) {
      sub = await SubscriptionModel.findOne({ userId }).sort({ createdAt: -1 });
    } else {
      sub = inMemorySubscriptions.get(userId);
    }

    if (!sub || sub.tier === "free") {
      return { tier: "free", status: "active" };
    }

    const now = new Date();
    const periodEnd = new Date(sub.currentPeriodEnd);

    // Active within period
    if (periodEnd > now) {
      return { tier: sub.tier, status: "active", expiresAt: periodEnd };
    }

    // In Grace Period (typically 3 days past expiration)
    if (sub.gracePeriodExpiresAt && new Date(sub.gracePeriodExpiresAt) > now) {
      return { tier: sub.tier, status: "grace_period", expiresAt: new Date(sub.gracePeriodExpiresAt) };
    }

    // Expired subscription defaults to free tier
    return { tier: "free", status: "expired" };
  }

  /**
   * Compares if a user's tier satisfies the required minimum tier
   */
  tierSatisfies(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
    const weights: Record<SubscriptionTier, number> = {
      free: 0,
      pro: 1,
      premium: 2,
    };
    return weights[userTier] >= weights[requiredTier];
  }

  /**
   * Checks if a user has entitlement to execute a protected feature
   */
  async checkFeatureAccess(
    userId: string,
    featureKey: string
  ): Promise<{
    allowed: boolean;
    userTier: SubscriptionTier;
    requiredTier: SubscriptionTier;
    status: string;
  }> {
    const requiredTier = FEATURE_ENTITLEMENT_GATES[featureKey] || "free";
    const active = await this.getUserActiveTier(userId);
    const allowed = this.tierSatisfies(active.tier, requiredTier);

    return {
      allowed,
      userTier: active.tier,
      requiredTier,
      status: active.status,
    };
  }

  // --- In-Memory Helpers for Testing ---
  setInMemorySubscription(userId: string, sub: any) {
    inMemorySubscriptions.set(userId, sub);
  }

  clearInMemorySubscriptions() {
    inMemorySubscriptions.clear();
  }
}

export const entitlementService = new EntitlementService();
