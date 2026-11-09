import { Request, Response } from "express";
import { FEATURE_CREDIT_COSTS } from "../config/credits";
import { creditService } from "../services/CreditService";
import { sendError, sendSuccess } from "../utils/response";

export class CreditController {
  static async getBalance(req: Request, res: Response) {
    if (!req.user?.userId) {
      return sendError(res, 401, "UNAUTHORIZED", "Authentication required");
    }
    const balance = await creditService.getBalance(req.user.userId);
    return sendSuccess(res, {
      creditBalance: balance,
      costs: FEATURE_CREDIT_COSTS,
    });
  }

  static async getHistory(req: Request, res: Response) {
    if (!req.user?.userId) {
      return sendError(res, 401, "UNAUTHORIZED", "Authentication required");
    }
    const history = await creditService.getTransactionHistory(req.user.userId);
    return sendSuccess(res, { history });
  }
}
