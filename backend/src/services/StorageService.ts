import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config";
import { AssetModel } from "../models/Asset";
import { logger } from "../utils/logger";

export interface StoredAssetInfo {
  assetId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uri: string;
  createdAt: string;
}

export class StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = config.uploadDir;
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveBase64Image(
    base64Data: string,
    mimeType = "image/png",
    originalName = "upload.png",
    userId?: string
  ): Promise<StoredAssetInfo> {
    const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");
    const assetId = uuidv4();
    const ext = mimeType.includes("png") ? ".png" : mimeType.includes("jpeg") ? ".jpg" : ".webp";
    const fileName = `${assetId}${ext}`;
    const filePath = path.join(this.uploadDir, fileName);

    await fs.promises.writeFile(filePath, buffer);

    if (config.enableMongodb) {
      try {
        await AssetModel.create({
          assetId,
          userId,
          originalName,
          mimeType,
          sizeBytes: buffer.length,
          storagePath: filePath,
          isTemporary: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h retention
        });
      } catch (err: any) {
        logger.warn("Could not save asset record to MongoDB", { error: err.message });
      }
    }

    return {
      assetId,
      originalName,
      mimeType,
      sizeBytes: buffer.length,
      uri: `/api/v1/storage/${assetId}`,
      createdAt: new Date().toISOString(),
    };
  }

  getAssetPath(assetId: string): string | null {
    const files = fs.readdirSync(this.uploadDir);
    const match = files.find((f) => f.startsWith(assetId));
    if (match) {
      return path.join(this.uploadDir, match);
    }
    return null;
  }

  async cleanupExpired(): Promise<number> {
    let count = 0;
    try {
      const files = await fs.promises.readdir(this.uploadDir);
      const now = Date.now();
      const maxAgeMs = 24 * 60 * 60 * 1000; // 24 hours

      for (const file of files) {
        const fullPath = path.join(this.uploadDir, file);
        const stats = await fs.promises.stat(fullPath);
        if (now - stats.mtimeMs > maxAgeMs) {
          await fs.promises.unlink(fullPath);
          count++;
        }
      }
    } catch (err: any) {
      logger.error("Error during storage cleanup", { error: err.message });
    }
    return count;
  }
}

export const storageService = new StorageService();
