import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response";
import { logger } from "../utils/logger";

/**
 * Middleware that strictly enforces administrative role access.
 * Rejects unauthenticated requests with 401 and non-admin users with 403 FORBIDDEN.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.userId) {
    return sendError(res, 401, "UNAUTHORIZED", "Authentication required");
  }

  if (req.user.role !== "admin") {
    logger.warn(`Unauthorized admin endpoint access attempt`, {
      userId: req.user.userId,
      role: req.user.role,
      path: req.originalUrl,
      ip: req.ip,
    });
    return sendError(res, 403, "FORBIDDEN", "Admin privileges required");
  }

  next();
}
