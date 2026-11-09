import { Request, Response } from "express";
import { authService } from "../services/AuthService";
import { privacyService } from "../services/PrivacyService";
import { sendError, sendSuccess } from "../utils/response";
import { UpdateProfileSchema } from "../validators/schemas";

export class UserController {
  static async getProfile(req: Request, res: Response) {
    if (!req.user || !req.user.userId) {
      return sendError(res, 401, "UNAUTHORIZED", "Authentication required");
    }
    try {
      const profile = await authService.getProfile(req.user.userId);
      return sendSuccess(res, profile);
    } catch (err: any) {
      return sendError(res, 404, "USER_NOT_FOUND", "User profile not found");
    }
  }

  static async updateProfile(req: Request, res: Response) {
    if (!req.user || !req.user.userId) {
      return sendError(res, 401, "UNAUTHORIZED", "Authentication required");
    }
    try {
      const validated = UpdateProfileSchema.parse(req.body);
      const updated = await authService.updateProfile(req.user.userId, validated);
      return sendSuccess(res, updated, { message: "Profile updated successfully" });
    } catch (err: any) {
      return sendError(res, 400, "UPDATE_FAILED", err.message || "Failed to update profile");
    }
  }

  static async exportData(req: Request, res: Response) {
    if (!req.user || !req.user.userId) {
      return sendError(res, 401, "UNAUTHORIZED", "Authentication required");
    }
    try {
      const data = await privacyService.exportUserData(req.user.userId);
      return sendSuccess(res, data);
    } catch (err: any) {
      if (err.message === "USER_NOT_FOUND") {
        return sendError(res, 404, "USER_NOT_FOUND", "User not found");
      }
      return sendError(res, 500, "EXPORT_FAILED", err.message || "Failed to export data");
    }
  }

  static async deleteAccount(req: Request, res: Response) {
    if (!req.user || !req.user.userId) {
      return sendError(res, 401, "UNAUTHORIZED", "Authentication required");
    }
    try {
      const { password, confirmEmail } = req.body;
      const result = await privacyService.deleteUserAccount(req.user.userId, {
        password,
        confirmEmail,
        ipAddress: req.ip,
      });
      return sendSuccess(res, result);
    } catch (err: any) {
      if (err.message === "PASSWORD_REQUIRED") {
        return sendError(res, 400, "PASSWORD_REQUIRED", "Current password is required to delete account");
      }
      if (err.message === "INVALID_PASSWORD") {
        return sendError(res, 401, "INVALID_PASSWORD", "Incorrect password provided");
      }
      if (err.message === "EMAIL_MISMATCH") {
        return sendError(res, 400, "EMAIL_MISMATCH", "Email confirmation did not match user account");
      }
      if (err.message === "USER_NOT_FOUND") {
        return sendError(res, 404, "USER_NOT_FOUND", "User not found");
      }
      return sendError(res, 500, "DELETE_FAILED", err.message || "Failed to delete account");
    }
  }
}
