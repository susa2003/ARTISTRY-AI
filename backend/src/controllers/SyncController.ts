import { Request, Response } from "express";
import { config } from "../config";
import { SyncedProjectModel } from "../models/SyncedProject";
import { logger } from "../utils/logger";
import { sendSuccess } from "../utils/response";
import { ProgressSyncSchema, ReplaySyncSchema } from "../validators/schemas";

export class SyncController {
  static async syncProgress(req: Request, res: Response) {
    const validated = ProgressSyncSchema.parse(req.body);
    const userId = req.user?.userId || validated.userId || "anonymous_artist";

    return sendSuccess(res, {
      synced: true,
      userId,
      dimensions: validated.dimensions,
      overallScore: validated.overallScore,
      syncedAt: new Date().toISOString(),
    });
  }

  static async syncReplay(req: Request, res: Response) {
    const validated = ReplaySyncSchema.parse(req.body);
    const userId = req.user?.userId || "anonymous_artist";

    if (config.enableMongodb) {
      try {
        await SyncedProjectModel.findOneAndUpdate(
          { projectId: validated.projectId, userId },
          {
            projectId: validated.projectId,
            userId,
            title: validated.title,
            strokeCount: validated.strokeCount,
            width: 800,
            height: 800,
            lastModifiedAt: new Date(),
          },
          { upsert: true }
        );
      } catch (err: any) {
        logger.warn("Could not sync project replay to MongoDB", { error: err.message });
      }
    }

    return sendSuccess(res, {
      synced: true,
      projectId: validated.projectId,
      strokeCount: validated.strokeCount,
      totalDurationMs: validated.totalDurationMs,
      syncedAt: new Date().toISOString(),
    });
  }
}
