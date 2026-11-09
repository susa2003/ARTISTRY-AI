import mongoose, { Document, Schema } from "mongoose";

export interface IEmailVerificationToken extends Document {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

const EmailVerificationTokenSchema = new Schema<IEmailVerificationToken>(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: true }
);

EmailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const EmailVerificationTokenModel = mongoose.model<IEmailVerificationToken>(
  "EmailVerificationToken",
  EmailVerificationTokenSchema
);
