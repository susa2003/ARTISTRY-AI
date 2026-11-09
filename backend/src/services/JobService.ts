import { v4 as uuidv4 } from "uuid";
import { config } from "../config";
import { AIJobModel, AIJobStatus } from "../models/AIJob";
import { logger } from "../utils/logger";

export interface AIJobRecord {
  jobId: string;
  userId?: string;
  type: string;
  status: AIJobStatus;
  progress: number;
  input: Record<string, any>;
  result?: Record<string, any>;
  error?: {
    code: string;
    message: string;
  };
  createdAt: string;
  updatedAt: string;
}

export class JobService {
  private memoryStore: Map<string, AIJobRecord> = new Map();

  async createJob(type: string, input: Record<string, any>, userId?: string): Promise<AIJobRecord> {
    const jobId = uuidv4();
    const now = new Date().toISOString();
    const record: AIJobRecord = {
      jobId,
      userId,
      type,
      status: "pending",
      progress: 0,
      input,
      createdAt: now,
      updatedAt: now,
    };

    this.memoryStore.set(jobId, record);

    if (config.enableMongodb) {
      try {
        await AIJobModel.create({
          jobId,
          userId,
          type,
          status: "pending",
          progress: 0,
          input,
        });
      } catch (err: any) {
        logger.warn("Could not save job to MongoDB", { jobId, error: err.message });
      }
    }

    return record;
  }

  async getJob(jobId: string): Promise<AIJobRecord | null> {
    const memory = this.memoryStore.get(jobId);
    if (memory) return memory;

    if (config.enableMongodb) {
      try {
        const doc = await AIJobModel.findOne({ jobId });
        if (doc) {
          const record: AIJobRecord = {
            jobId: doc.jobId,
            userId: doc.userId,
            type: doc.type,
            status: doc.status,
            progress: doc.progress,
            input: doc.input,
            result: doc.result,
            error: doc.error,
            createdAt: doc.createdAt.toISOString(),
            updatedAt: doc.updatedAt.toISOString(),
          };
          this.memoryStore.set(jobId, record);
          return record;
        }
      } catch (err: any) {
        logger.warn("Could not fetch job from MongoDB", { jobId, error: err.message });
      }
    }

    return null;
  }

  async updateProgress(jobId: string, progress: number, status: AIJobStatus = "processing"): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) return;

    job.progress = Math.min(100, Math.max(0, progress));
    job.status = status;
    job.updatedAt = new Date().toISOString();
    this.memoryStore.set(jobId, job);

    if (config.enableMongodb) {
      try {
        await AIJobModel.updateOne({ jobId }, { progress: job.progress, status });
      } catch (err: any) {
        logger.warn("Could not update job progress in MongoDB", { jobId, error: err.message });
      }
    }
  }

  async completeJob(jobId: string, result: Record<string, any>): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) return;

    job.status = "completed";
    job.progress = 100;
    job.result = result;
    job.updatedAt = new Date().toISOString();
    this.memoryStore.set(jobId, job);

    if (config.enableMongodb) {
      try {
        await AIJobModel.updateOne(
          { jobId },
          { status: "completed", progress: 100, result }
        );
      } catch (err: any) {
        logger.warn("Could not mark job completed in MongoDB", { jobId, error: err.message });
      }
    }
  }

  async failJob(jobId: string, code: string, message: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) return;

    job.status = "failed";
    job.error = { code, message };
    job.updatedAt = new Date().toISOString();
    this.memoryStore.set(jobId, job);

    if (config.enableMongodb) {
      try {
        await AIJobModel.updateOne(
          { jobId },
          { status: "failed", error: { code, message } }
        );
      } catch (err: any) {
        logger.warn("Could not mark job failed in MongoDB", { jobId, error: err.message });
      }
    }
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.getJob(jobId);
    if (!job || job.status === "completed" || job.status === "failed") {
      return false;
    }

    job.status = "cancelled";
    job.updatedAt = new Date().toISOString();
    this.memoryStore.set(jobId, job);

    if (config.enableMongodb) {
      try {
        await AIJobModel.updateOne({ jobId }, { status: "cancelled" });
      } catch (err: any) {
        logger.warn("Could not cancel job in MongoDB", { jobId, error: err.message });
      }
    }

    return true;
  }
}

export const jobService = new JobService();
