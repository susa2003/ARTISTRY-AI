import { Request, Response } from "express";
import os from "os";
import { aiBridgeService } from "../services/AIBridgeService";
import { sendSuccess } from "../utils/response";

export class SystemController {
  static async getHealth(req: Request, res: Response) {
    const memory = process.memoryUsage();
    return sendSuccess(res, {
      status: "healthy",
      service: "artistry-ai-backend",
      version: "1.0.0",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpuCores: os.cpus().length,
        freeMemoryMb: Math.round(os.freemem() / 1024 / 1024),
        totalMemoryMb: Math.round(os.totalmem() / 1024 / 1024),
      },
      processMemory: {
        rssMb: Math.round(memory.rss / 1024 / 1024),
        heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
      },
    });
  }

  static async getProviderStatus(req: Request, res: Response) {
    const status = await aiBridgeService.getStatus();
    return sendSuccess(res, status);
  }
}
