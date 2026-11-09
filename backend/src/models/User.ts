import mongoose, { Document, Schema } from "mongoose";

export interface IDrawingPreferences {
  defaultBrush: string;
  smoothing: string;
  autoSaveIntervalMs: number;
}

export interface IUser extends Document {
  userId: string;
  email: string;
  passwordHash?: string;
  displayName: string;
  avatarUrl?: string;
  role: "user" | "artist" | "admin";
  experienceMode: "beginner" | "professional";
  language: "en" | "ta";
  isEmailVerified: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  creditBalance: number;
  subscriptionTier: "free" | "pro" | "premium";
  drawingPreferences: IDrawingPreferences;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    displayName: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
    role: { type: String, enum: ["user", "artist", "admin"], default: "user" },
    experienceMode: { type: String, enum: ["beginner", "professional"], default: "beginner" },
    language: { type: String, enum: ["en", "ta"], default: "en" },
    isEmailVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: { type: String },
    creditBalance: { type: Number, default: 50 },
    subscriptionTier: { type: String, enum: ["free", "pro", "premium"], default: "free" },
    drawingPreferences: {
      defaultBrush: { type: String, default: "brush" },
      smoothing: { type: String, default: "medium" },
      autoSaveIntervalMs: { type: Number, default: 15000 },
    },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>("User", UserSchema);
