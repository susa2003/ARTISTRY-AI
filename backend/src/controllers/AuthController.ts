import { Request, Response } from "express";
import { ZodError } from "zod";
import { authService } from "../services/AuthService";
import { sendError, sendSuccess } from "../utils/response";
import {
  ChangePasswordSchema,
  ForgotPasswordSchema,
  GoogleLoginSchema,
  LoginSchema,
  RefreshTokenSchema,
  RegisterSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
} from "../validators/schemas";

function handleControllerError(res: Response, err: any) {
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0]?.message || "Validation failed";
    return sendError(res, 400, "VALIDATION_ERROR", firstIssue, err.issues);
  }
  if (err.message?.includes("DUPLICATE_ACCOUNT")) {
    return sendError(res, 409, "DUPLICATE_ACCOUNT", "An account with this email already exists");
  }
  if (err.message?.includes("WEAK_PASSWORD")) {
    return sendError(res, 400, "WEAK_PASSWORD", err.message.replace("WEAK_PASSWORD: ", ""));
  }
  if (err.message?.includes("INVALID_CREDENTIALS")) {
    return sendError(res, 401, "INVALID_CREDENTIALS", "Invalid email or password");
  }
  if (err.message?.includes("ACCOUNT_SUSPENDED")) {
    return sendError(res, 403, "ACCOUNT_SUSPENDED", err.message.replace("ACCOUNT_SUSPENDED: ", ""));
  }
  if (err.message?.includes("GOOGLE_AUTH_FAILED")) {
    return sendError(res, 401, "GOOGLE_AUTH_FAILED", "Failed to verify Google identity token");
  }
  if (err.message?.includes("REVOKED_REFRESH_TOKEN")) {
    return sendError(res, 401, "REVOKED_REFRESH_TOKEN", "Session compromised; all tokens revoked. Please log in again.");
  }
  if (err.message?.includes("EXPIRED_REFRESH_TOKEN")) {
    return sendError(res, 401, "EXPIRED_REFRESH_TOKEN", "Session expired. Please log in again.");
  }
  if (err.message?.includes("INVALID_REFRESH_TOKEN")) {
    return sendError(res, 401, "INVALID_REFRESH_TOKEN", "Invalid refresh token");
  }
  if (err.message?.includes("INVALID_OR_EXPIRED_RESET_TOKEN") || err.message?.includes("INVALID_TOKEN")) {
    return sendError(res, 400, "INVALID_TOKEN", "Token is invalid or has expired.");
  }
  if (err.message?.includes("INCORRECT_OLD_PASSWORD")) {
    return sendError(res, 400, "INCORRECT_PASSWORD", "Current password does not match.");
  }
  return sendError(res, 500, "INTERNAL_SERVER_ERROR", err.message || "An unexpected error occurred");
}

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const validated = RegisterSchema.parse(req.body);
      const context = {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      };

      const result = await authService.register(validated, context);
      return sendSuccess(res, result, { message: "Account registered successfully" }, 201);
    } catch (err: any) {
      return handleControllerError(res, err);
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const validated = LoginSchema.parse(req.body);
      const context = {
        deviceId: validated.deviceId,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      };

      const result = await authService.login(validated.email, validated.password, context);
      return sendSuccess(res, result, { message: "Login successful" });
    } catch (err: any) {
      return handleControllerError(res, err);
    }
  }

  static async googleLogin(req: Request, res: Response) {
    try {
      const validated = GoogleLoginSchema.parse(req.body);
      const context = {
        deviceId: validated.deviceId,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      };

      const result = await authService.googleLogin(validated.idToken, context);
      return sendSuccess(res, result, { message: "Google authentication successful" });
    } catch (err: any) {
      return handleControllerError(res, err);
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const validated = RefreshTokenSchema.parse(req.body);
      const context = {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      };

      const result = await authService.rotateRefreshToken(validated.refreshToken, context);
      return sendSuccess(res, result, { message: "Token refreshed successfully" });
    } catch (err: any) {
      return handleControllerError(res, err);
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const validated = RefreshTokenSchema.parse(req.body);
      await authService.logout(validated.refreshToken);
      return sendSuccess(res, { loggedOut: true }, { message: "Logged out successfully" });
    } catch (err: any) {
      return handleControllerError(res, err);
    }
  }

  static async logoutAll(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.userId) {
        return sendError(res, 401, "UNAUTHORIZED", "Authentication required");
      }
      const revokedCount = await authService.revokeAllUserTokens(req.user.userId);
      return sendSuccess(res, { revokedCount }, { message: "All sessions revoked successfully" });
    } catch (err: any) {
      return handleControllerError(res, err);
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      const validated = ForgotPasswordSchema.parse(req.body);
      const result = await authService.forgotPassword(validated.email);
      return sendSuccess(
        res,
        { sent: true, resetToken: result.resetToken },
        { message: "If the email is registered, a password reset link has been dispatched." }
      );
    } catch (err: any) {
      return handleControllerError(res, err);
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const validated = ResetPasswordSchema.parse(req.body);
      await authService.resetPassword(validated.token, validated.newPassword);
      return sendSuccess(res, { reset: true }, { message: "Password has been reset successfully. Please log in." });
    } catch (err: any) {
      return handleControllerError(res, err);
    }
  }

  static async changePassword(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.userId) {
        return sendError(res, 401, "UNAUTHORIZED", "Authentication required");
      }
      const validated = ChangePasswordSchema.parse(req.body);
      await authService.changePassword(req.user.userId, validated.oldPassword, validated.newPassword);
      return sendSuccess(res, { changed: true }, { message: "Password updated successfully. Other sessions logged out." });
    } catch (err: any) {
      return handleControllerError(res, err);
    }
  }

  static async verifyEmail(req: Request, res: Response) {
    try {
      const validated = VerifyEmailSchema.parse(req.body);
      await authService.verifyEmail(validated.token);
      return sendSuccess(res, { verified: true }, { message: "Email verified successfully." });
    } catch (err: any) {
      return handleControllerError(res, err);
    }
  }
}
