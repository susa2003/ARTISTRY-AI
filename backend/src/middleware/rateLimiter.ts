import rateLimit from "express-rate-limit";
import { sendError } from "../utils/response";

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 429, "RATE_LIMIT_EXCEEDED", "Too many requests. Please slow down.");
  },
});

export const aiProcessingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 heavy AI requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 429, "AI_RATE_LIMIT_EXCEEDED", "AI request limit exceeded. Please wait a moment.");
  },
});
