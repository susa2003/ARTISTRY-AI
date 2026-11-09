import { Router } from "express";
import { AIProcessingController } from "../controllers/AIProcessingController";
import { JobController } from "../controllers/JobController";
import { StorageController } from "../controllers/StorageController";
import { SyncController } from "../controllers/SyncController";
import { SystemController } from "../controllers/SystemController";
import { VoiceController } from "../controllers/VoiceController";
import { authMiddleware } from "../middleware/auth";
import { aiProcessingLimiter } from "../middleware/rateLimiter";
import { uploadMiddleware } from "../middleware/upload";

const router = Router();

// 1 & 2: Health & Provider Status
router.get("/health", SystemController.getHealth);
router.get("/providers/status", SystemController.getProviderStatus);

// 3 & 4: General Processing Gateways
router.post("/ai/process", authMiddleware(), aiProcessingLimiter, AIProcessingController.unifiedProcess);
router.post("/image/process", authMiddleware(), aiProcessingLimiter, AIProcessingController.convertSketch);

// 5 to 16: Specialized AI Drawing Features
router.post("/sketch/convert", authMiddleware(), aiProcessingLimiter, AIProcessingController.convertSketch);
router.post("/drawing/analyze", authMiddleware(), aiProcessingLimiter, AIProcessingController.analyzeDrawing);
router.post("/reference/generate", authMiddleware(), aiProcessingLimiter, AIProcessingController.generateReference);
router.post("/pose/detect", authMiddleware(), aiProcessingLimiter, AIProcessingController.detectPose);
router.post("/handfoot/detect", authMiddleware(), aiProcessingLimiter, AIProcessingController.detectHandFoot);
router.post("/lighting/analyze", authMiddleware(), aiProcessingLimiter, AIProcessingController.analyzeLighting);
router.post("/composition/analyze", authMiddleware(), aiProcessingLimiter, AIProcessingController.analyzeComposition);
router.post("/linecleaner/clean", authMiddleware(), aiProcessingLimiter, AIProcessingController.cleanLineArt);
router.post("/segmentation/separate", authMiddleware(), aiProcessingLimiter, AIProcessingController.separateObject);
router.post("/color/recommend", authMiddleware(), aiProcessingLimiter, AIProcessingController.recommendColors);
router.post("/turnaround/generate", authMiddleware(), aiProcessingLimiter, AIProcessingController.generateTurnaround);
router.post("/mistakes/detect", authMiddleware(), aiProcessingLimiter, AIProcessingController.detectMistakes);
router.post("/mentor/chat", authMiddleware(), aiProcessingLimiter, AIProcessingController.chatArtMentor);
router.post("/vectorize", authMiddleware(), aiProcessingLimiter, AIProcessingController.vectorizeSketch);

// 18 & 19: Progress & Replay Synchronization
router.post("/sync/progress", authMiddleware(), SyncController.syncProgress);
router.post("/sync/replays", authMiddleware(), SyncController.syncReplay);

// 20: Voice Assistant Processing
router.post("/voice/process", authMiddleware(), VoiceController.processVoice);

// 21: File Storage Upload & Retrieval
router.post("/storage/upload", authMiddleware(), uploadMiddleware.single("file"), StorageController.uploadFile);
router.get("/storage/:assetId", StorageController.getFile);
router.post("/storage/cleanup", authMiddleware(), StorageController.cleanup);

// 22: Asynchronous AI Jobs
router.get("/jobs/:jobId", authMiddleware(), JobController.getJobStatus);
router.post("/jobs/:jobId/cancel", authMiddleware(), JobController.cancelJob);

export default router;
