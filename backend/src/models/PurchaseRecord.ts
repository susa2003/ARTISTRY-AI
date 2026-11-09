import mongoose, { Document, Schema } from "mongoose";

export interface IPurchaseRecord extends Document {
  orderId: string;
  userId: string;
  productId: string;
  purchaseToken: string;
  purchaseTime: Date;
  verificationStatus: "verified" | "failed" | "duplicate" | "unverified";
  rawVerificationResponse?: Record<string, any>;
  environment: "production" | "sandbox" | "test";
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseRecordSchema = new Schema<IPurchaseRecord>(
  {
    orderId: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    purchaseToken: { type: String, required: true, unique: true, index: true },
    purchaseTime: { type: Date, default: Date.now },
    verificationStatus: {
      type: String,
      enum: ["verified", "failed", "duplicate", "unverified"],
      default: "unverified",
      index: true,
    },
    rawVerificationResponse: { type: Schema.Types.Mixed },
    environment: { type: String, enum: ["production", "sandbox", "test"], default: "production" },
  },
  { timestamps: true }
);

export const PurchaseRecordModel = mongoose.model<IPurchaseRecord>("PurchaseRecord", PurchaseRecordSchema);
