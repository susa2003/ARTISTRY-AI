import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger";
import { sendError } from "../utils/response";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error("Unhandled error encountered", {
    path: req.path,
    method: req.method,
    requestId: req.id,
    error: err.message,
    stack: err.stack,
  });

  if (err instanceof ZodError) {
    return sendError(res, 400, "VALIDATION_ERROR", "Invalid request parameters", err.errors);
  }

  if (err.name === "MulterError") {
    return sendError(res, 400, "UPLOAD_ERROR", err.message);
  }

  const statusCode = typeof err.statusCode === "number" ? err.statusCode : 500;
  const message = err.message || "Internal server error";
  return sendError(res, statusCode, "INTERNAL_SERVER_ERROR", message);
}
