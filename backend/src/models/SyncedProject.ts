import mongoose, { Document, Schema } from "mongoose";

export interface ISyncedProject extends Document {
  projectId: string;
  userId: string;
  title: string;
  width: number;
  height: number;
  strokeCount: number;
  thumbnailUri?: string;
  strokesData?: string; // Serialized JSON string of strokes
  lastModifiedAt: Date;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const SyncedProjectSchema = new Schema<ISyncedProject>(
  {
    projectId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    strokeCount: { type: Number, default: 0 },
    thumbnailUri: { type: String },
    strokesData: { type: String },
    lastModifiedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

SyncedProjectSchema.index({ projectId: 1, userId: 1 }, { unique: true });

export const SyncedProjectModel = mongoose.model<ISyncedProject>(
  "SyncedProject",
  SyncedProjectSchema
);
