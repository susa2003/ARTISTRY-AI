import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  userId: string;
  email?: string;
  displayName?: string;
  role: "user" | "artist" | "admin";
  experienceMode: "beginner" | "professional";
  language: "en" | "ta";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    email: { type: String, sparse: true },
    displayName: { type: String },
    role: { type: String, enum: ["user", "artist", "admin"], default: "user" },
    experienceMode: { type: String, enum: ["beginner", "professional"], default: "beginner" },
    language: { type: String, enum: ["en", "ta"], default: "en" },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>("User", UserSchema);
