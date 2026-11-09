import { Request, Response } from "express";
import { jobService } from "../services/JobService";
import { sendError, sendSuccess } from "../utils/response";

export class JobController {
  static async getJobStatus(req: Request, res: Response) {
    const jobId = String(req.params.jobId);
    const job = await jobService.getJob(jobId);

    if (!job) {
      return sendError(res, 404, "JOB_NOT_FOUND", `Job with id ${jobId} not found`);
    }

    return sendSuccess(res, job);
  }

  static async cancelJob(req: Request, res: Response) {
    const jobId = String(req.params.jobId);
    const cancelled = await jobService.cancelJob(jobId);

    if (!cancelled) {
      return sendError(
        res,
        400,
        "CANNOT_CANCEL",
        `Job with id ${jobId} could not be cancelled (may be already completed, failed, or non-existent)`
      );
    }

    return sendSuccess(res, { jobId, status: "cancelled" });
  }
}
