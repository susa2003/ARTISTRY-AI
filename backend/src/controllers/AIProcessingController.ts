import { Request, Response } from "express";
import { aiBridgeService } from "../services/AIBridgeService";
import { jobService } from "../services/JobService";
import { sendSuccess } from "../utils/response";
import {
  ArtMentorSchema,
  ColorRecommendSchema,
  CompositionAnalysisSchema,
  DrawingAnalysisSchema,
  HandFootDetectionSchema,
  LightingAnalysisSchema,
  LineArtCleanSchema,
  MistakeDetectSchema,
  MultiAngleGenerateSchema,
  PoseDetectionSchema,
  ReferenceGenerateSchema,
  SegmentationSchema,
  SketchConvertSchema,
  VectorizeSchema,
} from "../validators/schemas";

export class AIProcessingController {
  static async convertSketch(req: Request, res: Response) {
    const validated = SketchConvertSchema.parse(req.body);
    const result = await aiBridgeService.convertSketch(validated.imageUri, validated.options);
    return sendSuccess(res, result);
  }

  static async analyzeDrawing(req: Request, res: Response) {
    const validated = DrawingAnalysisSchema.parse(req.body);

    if (req.headers["prefer-async"] === "true") {
      const job = await jobService.createJob("drawing_analysis", validated, req.user?.userId);
      // Run in background
      (async () => {
        try {
          await jobService.updateProgress(job.jobId, 25);
          const result = await aiBridgeService.analyzeDrawing(validated);
          await jobService.completeJob(job.jobId, result);
        } catch (err: any) {
          await jobService.failJob(job.jobId, "ANALYSIS_FAILED", err.message);
        }
      })();
      return sendSuccess(res, { jobId: job.jobId, status: "pending" }, undefined, 202);
    }

    const result = await aiBridgeService.analyzeDrawing(validated);
    return sendSuccess(res, result);
  }

  static async generateReference(req: Request, res: Response) {
    const validated = ReferenceGenerateSchema.parse(req.body);
    const result = await aiBridgeService.generateReference(validated);
    return sendSuccess(res, result);
  }

  static async detectPose(req: Request, res: Response) {
    const validated = PoseDetectionSchema.parse(req.body);
    const result = await aiBridgeService.detectPose(validated);
    return sendSuccess(res, result);
  }

  static async detectHandFoot(req: Request, res: Response) {
    const validated = HandFootDetectionSchema.parse(req.body);
    const result = await aiBridgeService.detectHandFoot(validated);
    return sendSuccess(res, result);
  }

  static async analyzeLighting(req: Request, res: Response) {
    const validated = LightingAnalysisSchema.parse(req.body);
    const result = await aiBridgeService.analyzeLighting(validated);
    return sendSuccess(res, result);
  }

  static async analyzeComposition(req: Request, res: Response) {
    const validated = CompositionAnalysisSchema.parse(req.body);
    const result = await aiBridgeService.analyzeComposition(validated);
    return sendSuccess(res, result);
  }

  static async cleanLineArt(req: Request, res: Response) {
    const validated = LineArtCleanSchema.parse(req.body);
    const result = await aiBridgeService.cleanLineArt(validated);
    return sendSuccess(res, result);
  }

  static async separateObject(req: Request, res: Response) {
    const validated = SegmentationSchema.parse(req.body);
    const result = await aiBridgeService.separateObject(validated);
    return sendSuccess(res, result);
  }

  static async recommendColors(req: Request, res: Response) {
    const validated = ColorRecommendSchema.parse(req.body);
    const result = await aiBridgeService.recommendColors(validated);
    return sendSuccess(res, result);
  }

  static async generateTurnaround(req: Request, res: Response) {
    const validated = MultiAngleGenerateSchema.parse(req.body);
    const result = await aiBridgeService.generateTurnaround(validated);
    return sendSuccess(res, result);
  }

  static async detectMistakes(req: Request, res: Response) {
    const validated = MistakeDetectSchema.parse(req.body);
    const result = await aiBridgeService.detectMistakes(validated);
    return sendSuccess(res, result);
  }

  static async chatArtMentor(req: Request, res: Response) {
    const validated = ArtMentorSchema.parse(req.body);
    const result = await aiBridgeService.chatArtMentor(validated);
    return sendSuccess(res, result);
  }

  static async vectorizeSketch(req: Request, res: Response) {
    const validated = VectorizeSchema.parse(req.body);
    const result = await aiBridgeService.vectorizeSketch(validated);
    return sendSuccess(res, result);
  }

  static async unifiedProcess(req: Request, res: Response) {
    const feature = req.body?.feature;
    switch (feature) {
      case "sketch":
        return AIProcessingController.convertSketch(req, res);
      case "analyze":
        return AIProcessingController.analyzeDrawing(req, res);
      case "generate":
        return AIProcessingController.generateReference(req, res);
      case "pose":
        return AIProcessingController.detectPose(req, res);
      case "handfoot":
        return AIProcessingController.detectHandFoot(req, res);
      case "lighting":
        return AIProcessingController.analyzeLighting(req, res);
      case "composition":
        return AIProcessingController.analyzeComposition(req, res);
      default:
        return AIProcessingController.analyzeDrawing(req, res);
    }
  }
}
