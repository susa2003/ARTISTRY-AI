import { Request, Response } from "express";
import { googlePlayVerificationService } from "../services/GooglePlayVerificationService";
import { sendError, sendSuccess } from "../utils/response";
import { VerifyPurchaseSchema } from "../validators/schemas";

export class BillingController {
  static async verifyPurchase(req: Request, res: Response) {
    if (!req.user?.userId) {
      return sendError(res, 401, "UNAUTHORIZED", "Authentication required");
    }

    try {
      const validated = VerifyPurchaseSchema.parse(req.body);
      const result = await googlePlayVerificationService.verifyPurchase(req.user.userId, validated);

      if (!result.verified) {
        if (result.status === "DUPLICATE_TOKEN") {
          return sendError(res, 409, "DUPLICATE_PURCHASE_TOKEN", result.error || "Token already used");
        }
        if (result.status === "PACKAGE_MISMATCH" || result.status === "UNKNOWN_PRODUCT") {
          return sendError(res, 400, result.status, result.error || "Invalid purchase details");
        }
        if (result.status === "NOT_CONFIGURED") {
          return sendError(res, 503, "BILLING_NOT_CONFIGURED", result.error || "Google Play API not configured", {
            configurationNotes: result.configurationNotes,
          });
        }
        return sendError(res, 400, "VERIFICATION_FAILED", result.error || "Could not verify purchase");
      }

      return sendSuccess(res, result, { message: "Purchase verified and subscription activated successfully." });
    } catch (err: any) {
      return sendError(res, 400, "INVALID_PURCHASE_PAYLOAD", err.message || "Invalid purchase payload");
    }
  }

  static async getBillingStatus(req: Request, res: Response) {
    const configured = googlePlayVerificationService.isConfigured();
    return sendSuccess(res, {
      configured,
      packageName: "ai.artistry.studio",
      environment: process.env.NODE_ENV || "development",
      status: configured ? "READY" : "NOT_CONFIGURED",
    });
  }
}
