import mongoose, { Document, Schema } from "mongoose";
import { SubscriptionTier, BillingCycle } from "../config/plans";

export type SubscriptionStatus = "active" | "canceled" | "expired" | "grace_period";

export interface ISubscription extends Document {
  subscriptionId: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  productId: string;
  purchaseToken?: string;
  orderId?: string;
  startDate: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  gracePeriodExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    subscriptionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    tier: { type: String, enum: ["free", "pro", "premium"], default: "free" },
    status: {
      type: String,
      enum: ["active", "canceled", "expired", "grace_period"],
      default: "active",
      index: true,
    },
    billingCycle: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
    productId: { type: String, default: "artistry_free" },
    purchaseToken: { type: String },
    orderId: { type: String },
    startDate: { type: Date, default: Date.now },
    currentPeriodStart: { type: Date, default: Date.now },
    currentPeriodEnd: { type: Date, required: true },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    canceledAt: { type: Date },
    gracePeriodExpiresAt: { type: Date },
  },
  { timestamps: true }
);

export const SubscriptionModel = mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
