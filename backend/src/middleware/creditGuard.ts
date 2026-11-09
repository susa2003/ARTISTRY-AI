import { Request, Response, NextFunction } from "express";
import { getFeatureCost } from "../config/credits";
import { creditService } from "../services/CreditService";
import { sendError } from "../utils/response";

declare global {
  namespace Express {
    interface Request {
      creditDeduction?: {
        transactionId: string;
        deducted: number;
        newBalance: number;
      };
    }
  }
}

/**
 * Middleware ensuring user has sufficient AI credits and atomically deducting them
 */
export function requireCredits(featureKey: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const cost = getFeatureCost(featureKey);

    // Free features never deduct
    if (cost <= 0) {
      return next();
    }

    if (!req.user?.userId || req.user.userId.startsWith("anon_")) {
      return sendError(
        res,
        401,
        "AUTHENTICATION_REQUIRED",
        `Executing '${featureKey}' requires an authenticated account with AI credits.`
      );
    }

    const idempotencyKey = (req.headers["idempotency-key"] as string) || req.body?.idempotencyKey;

    try {
      const deduction = await creditService.deductCredits(req.user.userId, featureKey, {
        idempotencyKey,
        jobId: req.body?.jobId,
        description: `API execution: ${featureKey}`,
      });
      req.creditDeduction = deduction;
      return next();
    } catch (err: any) {
      if (err.message?.includes("INSUFFICIENT_CREDITS")) {
        const balance = await creditService.getBalance(req.user.userId);
        return sendError(
          res,
          402,
          "INSUFFICIENT_CREDITS",
          `Out of AI credits. This operation requires ${cost} credits, but your current balance is ${balance}.`,
          {
            cost,
            currentBalance: balance,
            upgradePlansUrl: "/api/v1/subscriptions/plans",
          }
        );
      }
      return sendError(res, 500, "CREDIT_DEDUCTION_FAILED", err.message || "Failed to process credits");
    }
  };
}
