import { Response } from "express";

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    requestId?: string;
    timestamp: string;
    page?: number;
    limit?: number;
    total?: number;
  };
};

export function sendSuccess<T>(
  res: Response,
  data: T,
  meta?: Record<string, any>,
  statusCode = 200
): Response {
  const requestId = res.getHeader("x-request-id") as string | undefined;
  const payload: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: any
): Response {
  const requestId = res.getHeader("x-request-id") as string | undefined;
  const payload: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
  return res.status(statusCode).json(payload);
}
