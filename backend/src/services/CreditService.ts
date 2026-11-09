import { v4 as uuidv4 } from "uuid";
import { config } from "../config";
import { getFeatureCost, FEATURE_CREDIT_COSTS } from "../config/credits";
import { CreditTransactionModel, CreditTransactionType, ICreditTransaction } from "../models/CreditTransaction";
import { UserModel } from "../models/User";
import { logger } from "../utils/logger";

export const inMemoryBalances = new Map<string, number>();
export const inMemoryTransactions = new Map<string, any>();
export const inMemoryIdempotency = new Map<string, any>();

export class CreditService {
  /**
   * Retrieves the current available AI credit balance for a user
   */
  async getBalance(userId: string): Promise<number> {
    if (config.enableMongodb) {
      const user = await UserModel.findOne({ userId });
      return user?.creditBalance ?? 50;
    }
    return inMemoryBalances.get(userId) ?? 50;
  }

  /**
   * Atomically deducts credits for an AI operation with idempotency protection
   */
  async deductCredits(
    userId: string,
    featureId: string,
    options?: {
      idempotencyKey?: string;
      jobId?: string;
      description?: string;
    }
  ): Promise<{
    success: boolean;
    deducted: number;
    newBalance: number;
    transactionId: string;
  }> {
    const cost = getFeatureCost(featureId);

    // 0-cost features (e.g. offline canvas) never deduct
    if (cost <= 0) {
      const balance = await this.getBalance(userId);
      return { success: true, deducted: 0, newBalance: balance, transactionId: "free_feature" };
    }

    // 1. Idempotency Check (Prevents double deduction on network retries)
    if (options?.idempotencyKey) {
      const cached = config.enableMongodb
        ? await CreditTransactionModel.findOne({ userId, idempotencyKey: options.idempotencyKey })
        : inMemoryIdempotency.get(`${userId}:${options.idempotencyKey}`);

      if (cached) {
        logger.info(`Idempotent credit deduction hit for key ${options.idempotencyKey}`);
        return {
          success: true,
          deducted: Math.abs(cached.amount),
          newBalance: cached.balanceAfter,
          transactionId: cached.transactionId,
        };
      }
    }

    const transactionId = uuidv4();
    let newBalance: number;

    if (config.enableMongodb) {
      // Atomic deduction conditional on having sufficient balance
      const updatedUser = await UserModel.findOneAndUpdate(
        { userId, creditBalance: { $gte: cost } },
        { $inc: { creditBalance: -cost } },
        { new: true }
      );

      if (!updatedUser) {
        const currentBalance = await this.getBalance(userId);
        throw new Error(
          `INSUFFICIENT_CREDITS: Required ${cost} credits, but current balance is ${currentBalance}`
        );
      }
      newBalance = updatedUser.creditBalance;

      await CreditTransactionModel.create({
        transactionId,
        userId,
        amount: -cost,
        balanceAfter: newBalance,
        type: "usage",
        featureId,
        idempotencyKey: options?.idempotencyKey,
        jobId: options?.jobId,
        description: options?.description || `AI operation: ${featureId}`,
        timestamp: new Date(),
      });
    } else {
      const current = inMemoryBalances.get(userId) ?? 50;
      if (current < cost) {
        throw new Error(
          `INSUFFICIENT_CREDITS: Required ${cost} credits, but current balance is ${current}`
        );
      }
      newBalance = current - cost;
      inMemoryBalances.set(userId, newBalance);

      const tx = {
        transactionId,
        userId,
        amount: -cost,
        balanceAfter: newBalance,
        type: "usage",
        featureId,
        idempotencyKey: options?.idempotencyKey,
        jobId: options?.jobId,
        description: options?.description || `AI operation: ${featureId}`,
        timestamp: new Date(),
      };
      inMemoryTransactions.set(transactionId, tx);
      if (options?.idempotencyKey) {
        inMemoryIdempotency.set(`${userId}:${options.idempotencyKey}`, tx);
      }
    }

    logger.info(`Deducted ${cost} credits from user ${userId} for ${featureId}. New balance: ${newBalance}`);
    return {
      success: true,
      deducted: cost,
      newBalance,
      transactionId,
    };
  }

  /**
   * Safely refunds credits for an eligible failed AI job
   */
  async refundCredits(
    userId: string,
    originalTxIdOrJobId: string,
    reason: string
  ): Promise<{
    refunded: number;
    newBalance: number;
    transactionId: string;
  }> {
    let originalTx: any;

    if (config.enableMongodb) {
      originalTx = await CreditTransactionModel.findOne({
        userId,
        $or: [{ transactionId: originalTxIdOrJobId }, { jobId: originalTxIdOrJobId }],
        type: "usage",
      });
    } else {
      for (const [_, tx] of inMemoryTransactions.entries()) {
        if (
          tx.userId === userId &&
          (tx.transactionId === originalTxIdOrJobId || tx.jobId === originalTxIdOrJobId) &&
          tx.type === "usage"
        ) {
          originalTx = tx;
          break;
        }
      }
    }

    if (!originalTx) {
      throw new Error("ORIGINAL_TRANSACTION_NOT_FOUND");
    }

    // Check if already refunded
    const refundIdempotency = `refund:${originalTx.transactionId}`;
    let existingRefund: any;
    if (config.enableMongodb) {
      existingRefund = await CreditTransactionModel.findOne({ idempotencyKey: refundIdempotency });
    } else {
      existingRefund = inMemoryIdempotency.get(refundIdempotency);
    }

    if (existingRefund) {
      const balance = await this.getBalance(userId);
      return { refunded: existingRefund.amount, newBalance: balance, transactionId: existingRefund.transactionId };
    }

    const refundAmount = Math.abs(originalTx.amount);
    const refundTxId = uuidv4();
    let newBalance: number;

    if (config.enableMongodb) {
      const updatedUser = await UserModel.findOneAndUpdate(
        { userId },
        { $inc: { creditBalance: refundAmount } },
        { new: true }
      );
      newBalance = updatedUser?.creditBalance ?? 50;

      await CreditTransactionModel.create({
        transactionId: refundTxId,
        userId,
        amount: refundAmount,
        balanceAfter: newBalance,
        type: "refund",
        featureId: originalTx.featureId,
        idempotencyKey: refundIdempotency,
        jobId: originalTx.jobId,
        description: `Refund: ${reason}`,
        timestamp: new Date(),
      });
    } else {
      const current = inMemoryBalances.get(userId) ?? 50;
      newBalance = current + refundAmount;
      inMemoryBalances.set(userId, newBalance);

      const tx = {
        transactionId: refundTxId,
        userId,
        amount: refundAmount,
        balanceAfter: newBalance,
        type: "refund",
        featureId: originalTx.featureId,
        idempotencyKey: refundIdempotency,
        jobId: originalTx.jobId,
        description: `Refund: ${reason}`,
        timestamp: new Date(),
      };
      inMemoryTransactions.set(refundTxId, tx);
      inMemoryIdempotency.set(refundIdempotency, tx);
    }

    logger.info(`Refunded ${refundAmount} credits to user ${userId}. Reason: ${reason}`);
    return {
      refunded: refundAmount,
      newBalance,
      transactionId: refundTxId,
    };
  }

  /**
   * Allocates credits to a user (e.g. monthly allowance, purchase, or admin adjustment)
   */
  async allocateCredits(
    userId: string,
    amount: number,
    type: CreditTransactionType,
    description: string
  ): Promise<number> {
    const txId = uuidv4();
    let newBalance: number;

    if (config.enableMongodb) {
      const user = await UserModel.findOneAndUpdate(
        { userId },
        { $inc: { creditBalance: amount } },
        { new: true }
      );
      newBalance = user?.creditBalance ?? 50;

      await CreditTransactionModel.create({
        transactionId: txId,
        userId,
        amount,
        balanceAfter: newBalance,
        type,
        description,
        timestamp: new Date(),
      });
    } else {
      const current = inMemoryBalances.get(userId) ?? 50;
      newBalance = current + amount;
      inMemoryBalances.set(userId, newBalance);

      inMemoryTransactions.set(txId, {
        transactionId: txId,
        userId,
        amount,
        balanceAfter: newBalance,
        type,
        description,
        timestamp: new Date(),
      });
    }

    return newBalance;
  }

  /**
   * Returns transaction history for a user
   */
  async getTransactionHistory(userId: string, limit = 50): Promise<any[]> {
    if (config.enableMongodb) {
      return await CreditTransactionModel.find({ userId }).sort({ timestamp: -1 }).limit(limit);
    }
    const results: any[] = [];
    for (const [_, tx] of inMemoryTransactions.entries()) {
      if (tx.userId === userId) {
        results.push(tx);
      }
    }
    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
  }

  /**
   * Returns all transactions across users (for admin analytics)
   */
  async getAllTransactions(limit = 1000): Promise<any[]> {
    if (config.enableMongodb) {
      return await CreditTransactionModel.find().sort({ timestamp: -1 }).limit(limit);
    }
    return Array.from(inMemoryTransactions.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // --- In-Memory Helpers for Testing ---
  setInMemoryBalance(userId: string, balance: number) {
    inMemoryBalances.set(userId, balance);
  }

  clearInMemoryCredits() {
    inMemoryBalances.clear();
    inMemoryTransactions.clear();
    inMemoryIdempotency.clear();
  }
}

export const creditService = new CreditService();
