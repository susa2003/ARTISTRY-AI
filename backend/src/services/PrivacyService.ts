import { v4 as uuidv4 } from "uuid";
import { config } from "../config";
import { CreditTransactionModel } from "../models/CreditTransaction";
import {
  inMemoryNotifications,
  NotificationRecordModel,
} from "../models/NotificationRecord";
import { IPurchaseRecord, PurchaseRecordModel } from "../models/PurchaseRecord";
import { RefreshTokenModel } from "../models/RefreshToken";
import { SubscriptionModel } from "../models/Subscription";
import { SyncedProjectModel } from "../models/SyncedProject";
import { UserModel } from "../models/User";
import { adminService } from "./AdminService";
import { inMemoryRefreshTokens, inMemoryUsers } from "./AuthService";
import { creditService, inMemoryBalances, inMemoryTransactions } from "./CreditService";
import { inMemoryPurchases } from "./GooglePlayVerificationService";
import { inMemorySubscriptions } from "./SubscriptionService";
import { logger } from "../utils/logger";
import { verifyPassword } from "../utils/security";

export class PrivacyService {
  /**
   * Generates a complete GDPR / CCPA data export for a user
   */
  async exportUserData(userId: string) {
    let user: any;
    if (config.enableMongodb) {
      user = await UserModel.findOne({ userId });
    } else {
      user = inMemoryUsers.get(userId);
    }

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    let subscriptions: any[] = [];
    if (config.enableMongodb) {
      subscriptions = await SubscriptionModel.find({ userId });
    } else {
      const sub = inMemorySubscriptions.get(userId);
      if (sub) subscriptions.push(sub);
    }

    const creditHistory = await creditService.getTransactionHistory(userId, 500);

    let purchases: any[] = [];
    if (config.enableMongodb) {
      purchases = await PurchaseRecordModel.find({ userId });
    } else {
      for (const [_, p] of inMemoryPurchases.entries()) {
        if (p.userId === userId) purchases.push(p);
      }
    }

    let syncedProjects: any[] = [];
    if (config.enableMongodb) {
      syncedProjects = await SyncedProjectModel.find({ userId });
    }

    let notifications: any[] = [];
    if (config.enableMongodb) {
      notifications = await NotificationRecordModel.find({ userId });
    } else {
      notifications = Array.from(inMemoryNotifications.values()).filter((n) => n.userId === userId);
    }

    await adminService.recordAuditLog({
      adminUserId: userId,
      action: "DATA_EXPORT",
      targetUserId: userId,
      details: { exportTime: new Date().toISOString() },
    });

    return {
      metadata: {
        exportDate: new Date().toISOString(),
        formatVersion: "1.0",
        complianceStandards: ["GDPR Article 20 (Right to Data Portability)", "CCPA/CPRA", "Google Play Privacy Policy"],
        contactEmail: "privacy@artistry.ai",
      },
      userProfile: {
        userId: user.userId,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        experienceMode: user.experienceMode,
        language: user.language,
        subscriptionTier: user.subscriptionTier,
        creditBalance: user.creditBalance,
        drawingPreferences: user.drawingPreferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      subscriptions,
      creditLedger: {
        currentBalance: user.creditBalance,
        transactions: creditHistory,
      },
      purchases: purchases.map((p) => ({
        orderId: p.orderId,
        productId: p.productId,
        purchaseTime: p.purchaseTime,
        verificationStatus: p.verificationStatus,
        environment: p.environment,
      })),
      syncedProjects: syncedProjects.map((sp) => ({
        projectId: sp.projectId,
        title: sp.title,
        strokeCount: sp.strokeCount,
        lastModifiedAt: sp.lastModifiedAt,
      })),
      notifications: notifications.map((n) => ({
        notificationId: n.notificationId,
        title: n.title,
        body: n.body,
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
    };
  }

  /**
   * Permanently deletes user account and personal data (GDPR Right to Erasure)
   */
  async deleteUserAccount(
    userId: string,
    confirmation: { password?: string; confirmEmail?: string; ipAddress?: string }
  ) {
    let user: any;
    if (config.enableMongodb) {
      user = await UserModel.findOne({ userId });
    } else {
      user = inMemoryUsers.get(userId);
    }

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // Security Verification:
    // If user has a password, require password verification.
    if (user.passwordHash) {
      if (!confirmation.password) {
        throw new Error("PASSWORD_REQUIRED");
      }
      const isMatch = await verifyPassword(confirmation.password, user.passwordHash);
      if (!isMatch) {
        throw new Error("INVALID_PASSWORD");
      }
    } else {
      // Social/Google login user
      if (
        !confirmation.confirmEmail ||
        confirmation.confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()
      ) {
        throw new Error("EMAIL_MISMATCH");
      }
    }

    // 1. Invalidate all active sessions & refresh tokens
    if (config.enableMongodb) {
      await RefreshTokenModel.deleteMany({ userId });
    } else {
      for (const [key, token] of inMemoryRefreshTokens.entries()) {
        if (token.userId === userId) {
          inMemoryRefreshTokens.delete(key);
        }
      }
    }

    // 2. Cancel and mark subscription as canceled
    if (config.enableMongodb) {
      await SubscriptionModel.updateMany({ userId }, { status: "canceled", cancelAtPeriodEnd: true });
    } else {
      inMemorySubscriptions.delete(userId);
    }

    // 3. Purge user synced cloud projects
    if (config.enableMongodb) {
      await SyncedProjectModel.deleteMany({ userId });
    }

    // 4. Anonymize purchase records for tax/accounting statutory requirements
    const anonId = `anonymized_${uuidv4()}`;
    if (config.enableMongodb) {
      await PurchaseRecordModel.updateMany({ userId }, { $set: { userId: anonId } });
    } else {
      for (const [_, p] of inMemoryPurchases.entries()) {
        if (p.userId === userId) {
          p.userId = anonId;
        }
      }
    }

    // 5. Purge notifications
    if (config.enableMongodb) {
      await NotificationRecordModel.deleteMany({ userId });
    } else {
      for (const [id, n] of inMemoryNotifications.entries()) {
        if (n.userId === userId) {
          inMemoryNotifications.delete(id);
        }
      }
    }

    // 6. Purge credit balances & transactions
    if (config.enableMongodb) {
      await CreditTransactionModel.deleteMany({ userId });
    } else {
      inMemoryBalances.delete(userId);
      for (const [txId, tx] of inMemoryTransactions.entries()) {
        if (tx.userId === userId) {
          inMemoryTransactions.delete(txId);
        }
      }
    }

    // 7. Purge user account record
    if (config.enableMongodb) {
      await UserModel.deleteOne({ userId });
    } else {
      inMemoryUsers.delete(userId);
      inMemoryUsers.delete(user.email);
    }

    // 8. Record audit trail
    await adminService.recordAuditLog({
      adminUserId: userId,
      action: "ACCOUNT_DELETE",
      targetUserId: anonId,
      details: {
        reason: "User requested account deletion",
        ipAddress: confirmation.ipAddress,
      },
    });

    logger.info(`User account ${userId} permanently purged via GDPR Right to Erasure`);

    return {
      deleted: true,
      userId,
      message: "Account and associated personal data deleted successfully",
    };
  }
}

export const privacyService = new PrivacyService();
