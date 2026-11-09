import mongoose, { Document, Schema } from "mongoose";

export interface IProviderUsage extends Document {
  provider: "gemini" | "openai" | "anthropic" | "fastapi_cv" | "local_fallback";
  modelUsed: string;
  feature: string;
  tokensPrompt?: number;
  tokensCompletion?: number;
  latencyMs: number;
  status: "success" | "error" | "fallback";
  userId?: string;
  createdAt: Date;
}

const ProviderUsageSchema = new Schema<IProviderUsage>(
  {
    provider: { type: String, required: true, index: true },
    modelUsed: { type: String, required: true },
    feature: { type: String, required: true, index: true },
    tokensPrompt: { type: Number, default: 0 },
    tokensCompletion: { type: Number, default: 0 },
    latencyMs: { type: Number, required: true },
    status: { type: String, enum: ["success", "error", "fallback"], required: true },
    userId: { type: String, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ProviderUsageModel = mongoose.model<IProviderUsage>(
  "ProviderUsage",
  ProviderUsageSchema
);
