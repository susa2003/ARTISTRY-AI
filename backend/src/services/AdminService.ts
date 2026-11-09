import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import { config } from "../config";
import { SUBSCRIPTION_PLANS, SubscriptionTier } from "../config/plans";
import { AdminAuditAction, AdminAuditLogModel, inMemoryAuditLogs } from "../models/AdminAuditLog";
import { CreditTransactionModel } from "../models/CreditTransaction";
import { SubscriptionModel } from "../models/Subscription";
import { IUser, UserModel } from "../models/User";
import { inMemoryUsers } from "./AuthService";
import { creditService } from "./CreditService";
import { inMemorySubscriptions } from "./SubscriptionService";
import { logger } from "../utils/logger";

export interface UserSearchOptions {
  query?: string;
  tier?: string;
  role?: string;
  isSuspended?: boolean;
  page?: number;
  limit?: number;
}

export class AdminService {
  /**
   * System Overview Metrics
   */
  async getSystemOverview() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    let totalUsers = 0;
    let activeUsers = 0;
    let tierCounts = { free: 0, pro: 0, premium: 0 };
    let totalCreditsInCirculation = 0;
    let totalCreditsSpent = 0;

    if (config.enableMongodb) {
      totalUsers = await UserModel.countDocuments();
      activeUsers = await UserModel.countDocuments({ updatedAt: { $gte: thirtyDaysAgo } });

      const tiers = await UserModel.aggregate([
        { $group: { _id: "$subscriptionTier", count: { $sum: 1 } } },
      ]);
      tiers.forEach((t) => {
        if (t._id in tierCounts) {
          tierCounts[t._id as keyof typeof tierCounts] = t.count;
        }
      });

      const creditAgg = await UserModel.aggregate([
        { $group: { _id: null, totalBalance: { $sum: "$creditBalance" } } },
      ]);
      totalCreditsInCirculation = creditAgg[0]?.totalBalance ?? 0;

      const spentAgg = await CreditTransactionModel.aggregate([
        { $match: { amount: { $lt: 0 } } },
        { $group: { _id: null, totalSpent: { $sum: "$amount" } } },
      ]);
      totalCreditsSpent = Math.abs(spentAgg[0]?.totalSpent ?? 0);
    } else {
      // In-memory computation
      const uniqueUsers = this.getUniqueInMemoryUsers();
      totalUsers = uniqueUsers.length;
      activeUsers = uniqueUsers.filter((u) => new Date(u.updatedAt || u.createdAt) >= thirtyDaysAgo).length;

      uniqueUsers.forEach((u) => {
        const tier = (u.subscriptionTier || "free") as keyof typeof tierCounts;
        if (tier in tierCounts) {
          tierCounts[tier]++;
        }
        totalCreditsInCirculation += u.creditBalance ?? 50;
      });

      const transactions = await creditService.getAllTransactions();
      totalCreditsSpent = transactions
        .filter((tx) => tx.amount < 0)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    }

    const estimatedMRR =
      tierCounts.pro * SUBSCRIPTION_PLANS.pro.pricing.monthlyUsd +
      tierCounts.premium * SUBSCRIPTION_PLANS.premium.pricing.monthlyUsd;

    return {
      overview: {
        totalUsers,
        activeUsersLast30Days: activeUsers,
        subscriptionDistribution: tierCounts,
        financials: {
          estimatedMonthlyRecurringRevenueUsd: Number(estimatedMRR.toFixed(2)),
          estimatedAnnualRunRateUsd: Number((estimatedMRR * 12).toFixed(2)),
          currency: "USD",
        },
        credits: {
          totalCirculationBalance: totalCreditsInCirculation,
          totalCreditsConsumedAllTime: totalCreditsSpent,
        },
        systemHealth: {
          uptimeSeconds: Math.floor(process.uptime()),
          nodeVersion: process.version,
          memoryRssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
          databaseMode: config.enableMongodb
            ? mongoose.connection.readyState === 1
              ? "connected"
              : "disconnected"
            : "in-memory",
          timestamp: new Date().toISOString(),
        },
      },
    };
  }

  /**
   * Search and filter registered users with pagination
   */
  async searchUsers(options: UserSearchOptions) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    if (config.enableMongodb) {
      const filter: any = {};
      if (options.query) {
        const regex = new RegExp(options.query, "i");
        filter.$or = [{ email: regex }, { displayName: regex }];
      }
      if (options.tier) filter.subscriptionTier = options.tier;
      if (options.role) filter.role = options.role;
      if (typeof options.isSuspended === "boolean") filter.isSuspended = options.isSuspended;

      const total = await UserModel.countDocuments(filter);
      const docs = await UserModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return {
        users: docs.map((d) => this.sanitizeUser(d)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    // In-memory search
    let list = this.getUniqueInMemoryUsers();

    if (options.query) {
      const q = options.query.toLowerCase();
      list = list.filter(
        (u) =>
          u.email?.toLowerCase().includes(q) ||
          u.displayName?.toLowerCase().includes(q)
      );
    }
    if (options.tier) {
      list = list.filter((u) => u.subscriptionTier === options.tier);
    }
    if (options.role) {
      list = list.filter((u) => u.role === options.role);
    }
    if (typeof options.isSuspended === "boolean") {
      list = list.filter((u) => Boolean(u.isSuspended) === options.isSuspended);
    }

    list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    const total = list.length;
    const paginated = list.slice(skip, skip + limit);

    return {
      users: paginated.map((u) => this.sanitizeUser(u)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves comprehensive user details for admin inspection
   */
  async getUserDetails(userId: string) {
    let user: any;
    if (config.enableMongodb) {
      user = await UserModel.findOne({ userId });
    } else {
      user = inMemoryUsers.get(userId);
    }

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    let subscription: any;
    if (config.enableMongodb) {
      subscription = await SubscriptionModel.findOne({ userId }).sort({ createdAt: -1 });
    } else {
      subscription = inMemorySubscriptions.get(userId);
    }

    const creditHistory = await creditService.getTransactionHistory(userId, 50);

    let auditLogs: any[] = [];
    if (config.enableMongodb) {
      auditLogs = await AdminAuditLogModel.find({ targetUserId: userId }).sort({ timestamp: -1 }).limit(20);
    } else {
      auditLogs = inMemoryAuditLogs
        .filter((l) => l.targetUserId === userId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 20);
    }

    return {
      user: this.sanitizeUser(user),
      subscription: subscription
        ? {
            subscriptionId: subscription.subscriptionId,
            planId: subscription.planId,
            tier: subscription.tier,
            status: subscription.status,
            billingCycle: subscription.billingCycle,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : null,
      creditHistory,
      auditHistory: auditLogs,
    };
  }

  /**
   * Suspend or unsuspend user account
   */
  async setUserSuspension(
    adminUserId: string,
    targetUserId: string,
    isSuspended: boolean,
    reason?: string,
    ipAddress?: string
  ) {
    if (adminUserId === targetUserId) {
      throw new Error("CANNOT_SUSPEND_SELF");
    }

    let updatedUser: any;
    if (config.enableMongodb) {
      updatedUser = await UserModel.findOneAndUpdate(
        { userId: targetUserId },
        { isSuspended, suspensionReason: reason || null },
        { new: true }
      );
    } else {
      const user = inMemoryUsers.get(targetUserId);
      if (user) {
        user.isSuspended = isSuspended;
        user.suspensionReason = reason || undefined;
        user.updatedAt = new Date();
        inMemoryUsers.set(targetUserId, user);
        if (user.email) inMemoryUsers.set(user.email, user);
        updatedUser = user;
      }
    }

    if (!updatedUser) {
      throw new Error("USER_NOT_FOUND");
    }

    const action: AdminAuditAction = isSuspended ? "USER_SUSPEND" : "USER_UNSUSPEND";
    await this.recordAuditLog({
      adminUserId,
      action,
      targetUserId,
      details: { isSuspended, reason },
      ipAddress,
    });

    logger.info(`Admin ${adminUserId} ${isSuspended ? "suspended" : "unsuspended"} user ${targetUserId}`, { reason });

    return this.sanitizeUser(updatedUser);
  }

  /**
   * Adjust user AI credits manually
   */
  async adjustUserCredits(
    adminUserId: string,
    targetUserId: string,
    amount: number,
    reason: string,
    ipAddress?: string
  ) {
    let user: any;
    if (config.enableMongodb) {
      user = await UserModel.findOne({ userId: targetUserId });
    } else {
      user = inMemoryUsers.get(targetUserId);
    }

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const previousBalance = user.creditBalance ?? 50;
    const newBalance = await creditService.allocateCredits(
      targetUserId,
      amount,
      "admin_adjustment",
      `Admin adjustment: ${reason}`
    );

    // Keep inMemory user balance in sync
    if (!config.enableMongodb && user) {
      user.creditBalance = newBalance;
      inMemoryUsers.set(targetUserId, user);
      if (user.email) inMemoryUsers.set(user.email, user);
    }

    await this.recordAuditLog({
      adminUserId,
      action: "CREDIT_ADJUST",
      targetUserId,
      details: {
        amount,
        previousBalance,
        newBalance,
        reason,
      },
      ipAddress,
    });

    logger.info(`Admin ${adminUserId} adjusted credits for user ${targetUserId} by ${amount}. New balance: ${newBalance}`);

    return {
      userId: targetUserId,
      amount,
      previousBalance,
      newBalance,
      reason,
    };
  }

  /**
   * Change user access role (user, artist, admin)
   */
  async setUserRole(
    adminUserId: string,
    targetUserId: string,
    newRole: "user" | "artist" | "admin",
    ipAddress?: string
  ) {
    let updatedUser: any;
    let oldRole = "user";

    if (config.enableMongodb) {
      const existing = await UserModel.findOne({ userId: targetUserId });
      if (!existing) throw new Error("USER_NOT_FOUND");
      oldRole = existing.role;

      updatedUser = await UserModel.findOneAndUpdate(
        { userId: targetUserId },
        { role: newRole },
        { new: true }
      );
    } else {
      const user = inMemoryUsers.get(targetUserId);
      if (!user) throw new Error("USER_NOT_FOUND");
      oldRole = user.role;
      user.role = newRole;
      user.updatedAt = new Date();
      inMemoryUsers.set(targetUserId, user);
      if (user.email) inMemoryUsers.set(user.email, user);
      updatedUser = user;
    }

    await this.recordAuditLog({
      adminUserId,
      action: "ROLE_CHANGE",
      targetUserId,
      details: { oldRole, newRole },
      ipAddress,
    });

    logger.info(`Admin ${adminUserId} updated role of user ${targetUserId} from ${oldRole} to ${newRole}`);
    return this.sanitizeUser(updatedUser);
  }

  /**
   * Analytics breakdown of AI operations
   */
  async getAIUsageAnalytics() {
    const transactions = await creditService.getAllTransactions(2000);

    const featureBreakdown: Record<string, { calls: number; creditsSpent: number }> = {};
    let totalCreditsSpent = 0;
    let totalAICalls = 0;

    transactions.forEach((tx) => {
      if (tx.type === "usage" && tx.amount < 0) {
        const fid = tx.featureId || "unknown";
        if (!featureBreakdown[fid]) {
          featureBreakdown[fid] = { calls: 0, creditsSpent: 0 };
        }
        featureBreakdown[fid].calls += 1;
        featureBreakdown[fid].creditsSpent += Math.abs(tx.amount);
        totalCreditsSpent += Math.abs(tx.amount);
        totalAICalls += 1;
      }
    });

    return {
      totalAICalls,
      totalCreditsSpent,
      featureBreakdown,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get administrative audit logs
   */
  async getAuditLogs(limit = 100) {
    const capped = Math.min(500, Math.max(1, limit));
    if (config.enableMongodb) {
      return await AdminAuditLogModel.find().sort({ timestamp: -1 }).limit(capped);
    }
    return inMemoryAuditLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, capped);
  }

  /**
   * Internal audit log recorder
   */
  async recordAuditLog(entry: {
    adminUserId: string;
    action: AdminAuditAction;
    targetUserId?: string;
    details: Record<string, any>;
    ipAddress?: string;
  }) {
    const logId = uuidv4();
    const doc = {
      logId,
      adminUserId: entry.adminUserId,
      action: entry.action,
      targetUserId: entry.targetUserId,
      details: entry.details,
      ipAddress: entry.ipAddress,
      timestamp: new Date(),
    };

    if (config.enableMongodb) {
      await AdminAuditLogModel.create(doc);
    } else {
      inMemoryAuditLogs.push(doc);
    }

    return doc;
  }

  /**
   * Cleans in-memory audit logs for test isolation
   */
  clearInMemoryAuditLogs() {
    inMemoryAuditLogs.length = 0;
  }

  // --- Helpers ---
  private getUniqueInMemoryUsers(): any[] {
    const seen = new Set<string>();
    const list: any[] = [];
    for (const [_, user] of inMemoryUsers.entries()) {
      if (user && user.userId && !seen.has(user.userId)) {
        seen.add(user.userId);
        list.push(user);
      }
    }
    return list;
  }

  private sanitizeUser(u: any) {
    return {
      userId: u.userId,
      email: u.email,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      role: u.role || "user",
      experienceMode: u.experienceMode || "beginner",
      language: u.language || "en",
      isEmailVerified: Boolean(u.isEmailVerified),
      isSuspended: Boolean(u.isSuspended),
      suspensionReason: u.suspensionReason || null,
      creditBalance: u.creditBalance ?? 50,
      subscriptionTier: u.subscriptionTier || "free",
      createdAt: u.createdAt || new Date().toISOString(),
      updatedAt: u.updatedAt || u.createdAt || new Date().toISOString(),
    };
  }
}

export const adminService = new AdminService();
