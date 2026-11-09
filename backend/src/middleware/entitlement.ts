import { Request, Response, NextFunction } from "express";
import { SubscriptionTier } from "../config/plans";
import { entitlementService } from "../services/EntitlementService";
import { sendError } from "../utils/response";

/**
 * Middleware enforcing a minimum subscription tier for route access
 */
export function requireTier(minTier: SubscriptionTier) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId || "anon_guest";
    const activeInfo = await entitlementService.getUserActiveTier(userId);

    if (!entitlementService.tierSatisfies(activeInfo.tier, minTier)) {
      return sendError(
        res,
        403,
        "UPGRADE_REQUIRED",
        `This feature requires the ${minTier.toUpperCase()} subscription tier. Your current tier is ${activeInfo.tier.toUpperCase()}.`,
        {
          currentTier: activeInfo.tier,
          requiredTier: minTier,
          status: activeInfo.status,
          plansUrl: "/api/v1/subscriptions/plans",
        }
      );
    }

    return next();
  };
}

/**
 * Middleware enforcing feature-level entitlement
 */
export function requireFeature(featureKey: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId || "anon_guest";
    const access = await entitlementService.checkFeatureAccess(userId, featureKey);

    if (!access.allowed) {
      return sendError(
        res,
        403,
        "UPGRADE_REQUIRED",
        `Access to '${featureKey}' requires the ${access.requiredTier.toUpperCase()} plan. Your current plan is ${access.userTier.toUpperCase()}.`,
        {
          feature: featureKey,
          currentTier: access.userTier,
          requiredTier: access.requiredTier,
          plansUrl: "/api/v1/subscriptions/plans",
        }
      );
    }

    return next();
  };
}
