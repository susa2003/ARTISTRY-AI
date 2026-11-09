import mongoose, { Document, Schema } from "mongoose";

export type AIJobStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export interface IAIJob extends Document {
  jobId: string;
  userId?: string;
  type: string;
  status: AIJobStatus;
  progress: number;
  input: Record<string, any>;
  result?: Record<string, any>;
  error?: {
    code: string;
    message: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AIJobSchema = new Schema<IAIJob>(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, index: true },
    type: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    progress: { type: Number, default: 0 },
    input: { type: Schema.Types.Mixed, default: {} },
    result: { type: Schema.Types.Mixed },
    error: {
      code: { type: String },
      message: { type: String },
    },
  },
  { timestamps: true }
);

export const AIJobModel = mongoose.model<IAIJob>("AIJob", AIJobSchema);
