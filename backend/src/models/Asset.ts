import mongoose, { Document, Schema } from "mongoose";

export interface IAsset extends Document {
  assetId: string;
  userId?: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  isTemporary: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AssetSchema = new Schema<IAsset>(
  {
    assetId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, index: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    storagePath: { type: String, required: true },
    isTemporary: { type: Boolean, default: true },
    expiresAt: { type: Date, index: { expires: "1d" } }, // Automatic MongoDB TTL cleanup
  },
  { timestamps: true }
);

export const AssetModel = mongoose.model<IAsset>("Asset", AssetSchema);
