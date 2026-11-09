import mongoose, { Document, Schema } from "mongoose";

export type CreditTransactionType =
  | "monthly_allocation"
  | "purchase"
  | "usage"
  | "refund"
  | "admin_adjustment";

export interface ICreditTransaction extends Document {
  transactionId: string;
  userId: string;
  amount: number; // e.g. -5 for deduction or +500 for monthly grant
  balanceAfter: number;
  type: CreditTransactionType;
  featureId?: string;
  idempotencyKey?: string;
  jobId?: string;
  description: string;
  timestamp: Date;
}

const CreditTransactionSchema = new Schema<ICreditTransaction>(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    type: {
      type: String,
      enum: ["monthly_allocation", "purchase", "usage", "refund", "admin_adjustment"],
      required: true,
      index: true,
    },
    featureId: { type: String },
    idempotencyKey: { type: String, sparse: true, index: true },
    jobId: { type: String },
    description: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const CreditTransactionModel = mongoose.model<ICreditTransaction>(
  "CreditTransaction",
  CreditTransactionSchema
);
