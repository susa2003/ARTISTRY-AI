import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import { apiRateLimiter } from "./middleware/rateLimiter";
import { requestIdMiddleware } from "./middleware/requestId";
import v1Router from "./routes/v1";

// Controllers for root legacy alias compatibility
import { AIProcessingController } from "./controllers/AIProcessingController";
import { SystemController } from "./controllers/SystemController";

export const app = express();

// Security and common middlewares
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin === "*" ? true : config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(requestIdMiddleware);
app.use(apiRateLimiter);

// Primary versioned API router
app.use(config.apiPrefix, v1Router);

// Flat alias routes (100% backwards compatibility with existing CloudHttpProvider)
app.get("/health", SystemController.getHealth);
app.post("/sketch", AIProcessingController.convertSketch);
app.post("/analyze", AIProcessingController.analyzeDrawing);
app.post("/generate", AIProcessingController.generateReference);
app.post("/pose", AIProcessingController.detectPose);
app.post("/handfoot", AIProcessingController.detectHandFoot);
app.post("/lighting", AIProcessingController.analyzeLighting);
app.post("/composition", AIProcessingController.analyzeComposition);
app.post("/linecleaner", AIProcessingController.cleanLineArt);
app.post("/segmentation", AIProcessingController.separateObject);
app.post("/colorrec", AIProcessingController.recommendColors);
app.post("/turnaround", AIProcessingController.generateTurnaround);
app.post("/mistakes", AIProcessingController.detectMistakes);
app.post("/mentor", AIProcessingController.chatArtMentor);
app.post("/vectorize", AIProcessingController.vectorizeSketch);

// Centralized error handling
app.use(errorHandler);
