import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { sendError } from "../utils/response";

export interface AuthUser {
  userId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authMiddleware(required = false) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      if (required) {
        return sendError(res, 401, "UNAUTHORIZED", "Authorization token required");
      }
      // Anonymous user support in dev/offline
      req.user = { userId: "anon_" + (req.id?.slice(0, 8) || "guest"), role: "user" };
      return next();
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;
      req.user = decoded;
      return next();
    } catch (err: any) {
      if (required) {
        return sendError(res, 401, "INVALID_TOKEN", "Authentication token is invalid or expired");
      }
      req.user = { userId: "anon_guest", role: "user" };
      return next();
    }
  };
}
