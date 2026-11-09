import mongoose, { Document, Schema } from "mongoose";

export type AdminAuditAction =
  | "USER_SUSPEND"
  | "USER_UNSUSPEND"
  | "CREDIT_ADJUST"
  | "PLAN_CHANGE"
  | "ROLE_CHANGE"
  | "DATA_EXPORT"
  | "ACCOUNT_DELETE";

export interface IAdminAuditLog extends Document {
  logId: string;
  adminUserId: string;
  action: AdminAuditAction;
  targetUserId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  timestamp: Date;
}

const AdminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    logId: { type: String, required: true, unique: true, index: true },
    adminUserId: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    targetUserId: { type: String, index: true },
    details: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const AdminAuditLogModel = mongoose.model<IAdminAuditLog>("AdminAuditLog", AdminAuditLogSchema);

export const inMemoryAuditLogs: any[] = [];
