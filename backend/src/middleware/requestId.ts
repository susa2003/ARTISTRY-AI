import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const incomingId = req.headers["x-request-id"];
  const id = (typeof incomingId === "string" && incomingId) ? incomingId : uuidv4();
  req.id = id;
  res.setHeader("x-request-id", id);
  next();
}
