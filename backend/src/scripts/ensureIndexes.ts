/**
 * ARTISTRY AI — Production MongoDB Index Synchronization Script
 * Ensures all collection indexes (unique constraints, compound indexes, TTL expiry) are built.
 *
 * Usage:
 *   npx ts-node src/scripts/ensureIndexes.ts
 */

import mongoose from "mongoose";
import { config } from "../config";
import { logger } from "../utils/logger";
import {
  UserModel,
  SubscriptionModel,
  RefreshTokenModel,
  PurchaseRecordModel,
  CreditTransactionModel,
  AIJobModel,
  AssetModel,
  AdminAuditLogModel,
  NotificationRecordModel,
  PasswordResetTokenModel,
  EmailVerificationTokenModel,
  SyncedProjectModel,
  ProviderUsageModel,
} from "../models";

async function ensureAllIndexes() {
  logger.info("Connecting to MongoDB to synchronize production indexes...", {
    uri: config.mongodbUri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@"),
  });

  await mongoose.connect(config.mongodbUri);
  logger.info("Connected to MongoDB.");

  const models = [
    { name: "User", model: UserModel },
    { name: "Subscription", model: SubscriptionModel },
    { name: "RefreshToken", model: RefreshTokenModel },
    { name: "PurchaseRecord", model: PurchaseRecordModel },
    { name: "CreditTransaction", model: CreditTransactionModel },
    { name: "AIJob", model: AIJobModel },
    { name: "Asset", model: AssetModel },
    { name: "AdminAuditLog", model: AdminAuditLogModel },
    { name: "NotificationRecord", model: NotificationRecordModel },
    { name: "PasswordResetToken", model: PasswordResetTokenModel },
    { name: "EmailVerificationToken", model: EmailVerificationTokenModel },
    { name: "SyncedProject", model: SyncedProjectModel },
    { name: "ProviderUsage", model: ProviderUsageModel },
  ];

  logger.info(`Synchronizing indexes for ${models.length} collections...`);

  for (const { name, model } of models) {
    try {
      const syncResult = await model.syncIndexes();
      logger.info(`Collection [${name}] indexes synchronized:`, { result: syncResult || "OK" });
    } catch (err: any) {
      logger.error(`Error synchronizing indexes for [${name}]:`, { error: err.message });
      throw err;
    }
  }

  logger.info("All MongoDB production indexes successfully verified and synchronized!");
  await mongoose.disconnect();
}

if (require.main === module) {
  ensureAllIndexes()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Index synchronization failed:", err);
      process.exit(1);
    });
}
