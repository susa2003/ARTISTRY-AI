import mongoose, { Document, Schema } from "mongoose";

export type NotificationType =
  | "credit_alert"
  | "subscription_alert"
  | "security_alert"
  | "system_announcement";

export interface INotificationRecord extends Document {
  notificationId: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationRecordSchema = new Schema<INotificationRecord>(
  {
    notificationId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: {
      type: String,
      enum: ["credit_alert", "subscription_alert", "security_alert", "system_announcement"],
      default: "system_announcement",
      index: true,
    },
    isRead: { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const NotificationRecordModel = mongoose.model<INotificationRecord>(
  "NotificationRecord",
  NotificationRecordSchema
);

export const inMemoryNotifications = new Map<string, any>();
