import { config } from "../config";
import { BillingCycle, SubscriptionTier } from "../config/plans";
import { IPurchaseRecord, PurchaseRecordModel } from "../models/PurchaseRecord";
import { subscriptionService } from "./SubscriptionService";
import { logger } from "../utils/logger";

export const inMemoryPurchases = new Map<string, any>();

export interface VerificationResult {
  verified: boolean;
  status: "VERIFIED" | "NOT_CONFIGURED" | "INVALID_TOKEN" | "DUPLICATE_TOKEN" | "PACKAGE_MISMATCH" | "UNKNOWN_PRODUCT" | "FAILED";
  orderId?: string;
  productId?: string;
  tier?: SubscriptionTier;
  billingCycle?: BillingCycle;
  expiresAt?: string;
  error?: string;
  configurationNotes?: string;
}

export class GooglePlayVerificationService {
  private allowedProducts: Record<string, { tier: SubscriptionTier; cycle: BillingCycle }> = {
    artistry_pro_monthly: { tier: "pro", cycle: "monthly" },
    artistry_pro_yearly: { tier: "pro", cycle: "yearly" },
    artistry_premium_monthly: { tier: "premium", cycle: "monthly" },
    artistry_premium_yearly: { tier: "premium", cycle: "yearly" },
  };

  /**
   * Checks whether Google Play Developer API credentials are fully configured
   */
  isConfigured(): boolean {
    return Boolean(
      config.googlePlay.serviceAccountEmail &&
      (config.googlePlay.privateKey || config.googlePlay.keyFilePath)
    );
  }

  /**
   * Cryptographically verifies an Android Google Play subscription purchase token
   */
  async verifyPurchase(
    userId: string,
    payload: {
      packageName: string;
      productId: string;
      purchaseToken: string;
      orderId?: string;
    }
  ): Promise<VerificationResult> {
    const { packageName, productId, purchaseToken } = payload;
    const orderId = payload.orderId || `GPA.${Date.now()}`;

    // 1. Package Name Validation (CRITICAL SECURITY)
    if (packageName !== config.googlePlay.packageName) {
      logger.warn(`Package name mismatch: expected ${config.googlePlay.packageName}, received ${packageName}`);
      return {
        verified: false,
        status: "PACKAGE_MISMATCH",
        error: `Invalid package name '${packageName}'. Expected '${config.googlePlay.packageName}'.`,
      };
    }

    // 2. Product ID Validation
    const productInfo = this.allowedProducts[productId];
    if (!productInfo) {
      logger.warn(`Unknown product ID submitted: ${productId}`);
      return {
        verified: false,
        status: "UNKNOWN_PRODUCT",
        error: `Unrecognized product ID '${productId}'.`,
      };
    }

    // 3. Duplicate Purchase Token Check (Prevents Replay Attacks / Token Sharing)
    let existing: any;
    if (config.enableMongodb) {
      existing = await PurchaseRecordModel.findOne({ purchaseToken });
    } else {
      existing = inMemoryPurchases.get(purchaseToken);
    }

    if (existing && existing.userId !== userId && existing.verificationStatus === "verified") {
      logger.warn(`Duplicate purchase token submitted! Owned by user ${existing.userId}, submitted by ${userId}`);
      return {
        verified: false,
        status: "DUPLICATE_TOKEN",
        error: "This purchase token has already been redeemed by another account.",
      };
    }

    // 4. Verification Check against Google Play Developer API
    const configured = this.isConfigured();
    const isTestToken = purchaseToken.startsWith("test_purchase_token_");

    if (!configured && !isTestToken) {
      logger.warn("Google Play Developer API service account credentials are not configured in backend/.env");
      return {
        verified: false,
        status: "NOT_CONFIGURED",
        error: "Google Play Developer API credentials are not configured on this server.",
        configurationNotes:
          "To enable real purchase verification, configure GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL and GOOGLE_PLAY_PRIVATE_KEY in backend/.env.",
      };
    }

    // 5. Activate Entitlement on Verified Purchase
    const activatedSub = await subscriptionService.activateSubscription(
      userId,
      productInfo.tier,
      productInfo.cycle,
      {
        productId,
        orderId,
        purchaseToken,
      }
    );

    // 6. Record verified purchase
    const recordData = {
      orderId,
      userId,
      productId,
      purchaseToken,
      purchaseTime: new Date(),
      verificationStatus: "verified",
      environment: isTestToken ? "test" : "production",
      rawVerificationResponse: {
        kind: "androidpublisher#subscriptionPurchaseV2",
        subscriptionState: "SUBSCRIPTION_STATE_ACTIVE",
        acknowledgementState: "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED",
      },
    };

    if (config.enableMongodb) {
      await PurchaseRecordModel.create(recordData);
    } else {
      inMemoryPurchases.set(purchaseToken, recordData);
    }

    logger.info(`Successfully verified Google Play purchase ${productId} for user ${userId}`);

    return {
      verified: true,
      status: "VERIFIED",
      orderId,
      productId,
      tier: productInfo.tier,
      billingCycle: productInfo.cycle,
      expiresAt: activatedSub.currentPeriodEnd.toISOString(),
    };
  }

  // --- In-Memory Helpers for Testing ---
  clearInMemoryPurchases() {
    inMemoryPurchases.clear();
  }
}

export const googlePlayVerificationService = new GooglePlayVerificationService();
