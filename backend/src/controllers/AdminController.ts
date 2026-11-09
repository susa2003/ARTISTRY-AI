import { Request, Response } from "express";
import { ZodError } from "zod";
import { adminService } from "../services/AdminService";
import { sendError, sendSuccess } from "../utils/response";
import {
  AdminAdjustCreditsSchema,
  AdminSetRoleSchema,
  AdminSuspendUserSchema,
} from "../validators/schemas";

function handleAdminError(res: Response, err: any) {
  if (err instanceof ZodError) {
    return sendError(
      res,
      400,
      "VALIDATION_ERROR",
      err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
    );
  }
  if (err.message === "USER_NOT_FOUND") {
    return sendError(res, 404, "USER_NOT_FOUND", "Target user does not exist");
  }
  if (err.message === "CANNOT_SUSPEND_SELF") {
    return sendError(
      res,
      400,
      "CANNOT_SUSPEND_SELF",
      "Administrators cannot suspend their own account"
    );
  }
  return sendError(res, 500, "INTERNAL_ERROR", err.message || "An unexpected error occurred");
}

export class AdminController {
  /**
   * GET /api/v1/admin/overview
   */
  static async getOverview(req: Request, res: Response) {
    try {
      const data = await adminService.getSystemOverview();
      return sendSuccess(res, data);
    } catch (err: any) {
      return handleAdminError(res, err);
    }
  }

  /**
   * GET /api/v1/admin/users
   */
  static async searchUsers(req: Request, res: Response) {
    try {
      const { query, tier, role, isSuspended, page, limit } = req.query;

      let isSuspendedBool: boolean | undefined = undefined;
      if (isSuspended === "true") isSuspendedBool = true;
      if (isSuspended === "false") isSuspendedBool = false;

      const results = await adminService.searchUsers({
        query: query ? String(query) : undefined,
        tier: tier ? String(tier) : undefined,
        role: role ? String(role) : undefined,
        isSuspended: isSuspendedBool,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      return sendSuccess(res, results);
    } catch (err: any) {
      return handleAdminError(res, err);
    }
  }

  /**
   * GET /api/v1/admin/users/:userId
   */
  static async getUserDetails(req: Request, res: Response) {
    try {
      const userId = String(req.params.userId);
      const data = await adminService.getUserDetails(userId);
      return sendSuccess(res, data);
    } catch (err: any) {
      return handleAdminError(res, err);
    }
  }

  /**
   * POST /api/v1/admin/users/:userId/suspend
   */
  static async suspendUser(req: Request, res: Response) {
    try {
      const userId = String(req.params.userId);
      const parsed = AdminSuspendUserSchema.parse(req.body);
      const updatedUser = await adminService.setUserSuspension(
        req.user!.userId,
        userId,
        parsed.isSuspended,
        parsed.reason,
        req.ip
      );
      return sendSuccess(res, {
        user: updatedUser,
        message: parsed.isSuspended ? "User suspended successfully" : "User unsuspended successfully",
      });
    } catch (err: any) {
      return handleAdminError(res, err);
    }
  }

  /**
   * POST /api/v1/admin/users/:userId/credits
   */
  static async adjustCredits(req: Request, res: Response) {
    try {
      const userId = String(req.params.userId);
      const parsed = AdminAdjustCreditsSchema.parse(req.body);
      const result = await adminService.adjustUserCredits(
        req.user!.userId,
        userId,
        parsed.amount,
        parsed.reason,
        req.ip
      );
      return sendSuccess(res, result);
    } catch (err: any) {
      return handleAdminError(res, err);
    }
  }

  /**
   * POST /api/v1/admin/users/:userId/role
   */
  static async setUserRole(req: Request, res: Response) {
    try {
      const userId = String(req.params.userId);
      const parsed = AdminSetRoleSchema.parse(req.body);
      const result = await adminService.setUserRole(
        req.user!.userId,
        userId,
        parsed.role,
        req.ip
      );
      return sendSuccess(res, { user: result, message: `User role updated to ${parsed.role}` });
    } catch (err: any) {
      return handleAdminError(res, err);
    }
  }

  /**
   * GET /api/v1/admin/analytics/ai
   */
  static async getAIAnalytics(req: Request, res: Response) {
    try {
      const data = await adminService.getAIUsageAnalytics();
      return sendSuccess(res, data);
    } catch (err: any) {
      return handleAdminError(res, err);
    }
  }

  /**
   * GET /api/v1/admin/audit-logs
   */
  static async getAuditLogs(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const logs = await adminService.getAuditLogs(limit);
      return sendSuccess(res, { auditLogs: logs, total: logs.length });
    } catch (err: any) {
      return handleAdminError(res, err);
    }
  }
}
