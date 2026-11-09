import { Request, Response } from "express";
import fs from "fs";
import { storageService } from "../services/StorageService";
import { sendError, sendSuccess } from "../utils/response";

export class StorageController {
  static async uploadFile(req: Request, res: Response) {
    if (!req.file) {
      return sendError(res, 400, "MISSING_FILE", "No file uploaded");
    }

    const assetId = req.file.filename.split(".")[0];
    return sendSuccess(
      res,
      {
        assetId,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        uri: `/api/v1/storage/${assetId}`,
        createdAt: new Date().toISOString(),
      },
      undefined,
      201
    );
  }

  static async getFile(req: Request, res: Response) {
    const assetId = String(req.params.assetId);
    const filePath = storageService.getAssetPath(assetId);

    if (!filePath || !fs.existsSync(filePath)) {
      return sendError(res, 404, "ASSET_NOT_FOUND", "Asset does not exist or has expired");
    }

    return res.sendFile(filePath);
  }

  static async cleanup(req: Request, res: Response) {
    const count = await storageService.cleanupExpired();
    return sendSuccess(res, { cleanedCount: count, message: "Storage cleanup completed" });
  }
}
