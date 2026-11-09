import { Router } from "express";
import { AdminController } from "../controllers/AdminController";
import { AIProcessingController } from "../controllers/AIProcessingController";
import { AuthController } from "../controllers/AuthController";
import { BillingController } from "../controllers/BillingController";
import { CreditController } from "../controllers/CreditController";
import { JobController } from "../controllers/JobController";
import { NotificationController } from "../controllers/NotificationController";
import { StorageController } from "../controllers/StorageController";
import { SubscriptionController } from "../controllers/SubscriptionController";
import { SyncController } from "../controllers/SyncController";
import { SystemController } from "../controllers/SystemController";
import { UserController } from "../controllers/UserController";
import { VoiceController } from "../controllers/VoiceController";
import { requireAdmin } from "../middleware/adminAuth";
import { authMiddleware } from "../middleware/auth";
import { requireFeature, requireTier } from "../middleware/entitlement";
import { aiProcessingLimiter, authLimiter } from "../middleware/rateLimiter";
import { uploadMiddleware } from "../middleware/upload";

const router = Router();

// --- Authentication Endpoints (Phase 6) ---
router.post("/auth/register", authLimiter, AuthController.register);
router.post("/auth/login", authLimiter, AuthController.login);
router.post("/auth/google", authLimiter, AuthController.googleLogin);
router.post("/auth/refresh", AuthController.refreshToken);
router.post("/auth/logout", AuthController.logout);
router.post("/auth/logout-all", authMiddleware(true), AuthController.logoutAll);
router.post("/auth/forgot-password", authLimiter, AuthController.forgotPassword);
router.post("/auth/reset-password", authLimiter, AuthController.resetPassword);
router.post("/auth/change-password", authMiddleware(true), AuthController.changePassword);
router.post("/auth/verify-email", AuthController.verifyEmail);

// --- User Profile & Privacy Endpoints (Phase 6) ---
router.get("/user/profile", authMiddleware(true), UserController.getProfile);
router.put("/user/profile", authMiddleware(true), UserController.updateProfile);
router.get("/user/export-data", authMiddleware(true), UserController.exportData);
router.post("/user/delete-account", authMiddleware(true), UserController.deleteAccount);

// --- User Notifications Endpoints (Phase 6) ---
router.get("/notifications", authMiddleware(true), NotificationController.getNotifications);
router.post("/notifications/:id/read", authMiddleware(true), NotificationController.markAsRead);
router.post("/notifications/read-all", authMiddleware(true), NotificationController.markAllAsRead);

// --- Subscription & Entitlement Endpoints (Phase 6) ---
router.get("/subscriptions/plans", SubscriptionController.getPlans);
router.get("/subscriptions/me", authMiddleware(true), SubscriptionController.getUserSubscription);
router.post("/subscriptions/cancel", authMiddleware(true), SubscriptionController.cancelSubscription);
router.post("/subscriptions/restore", authMiddleware(true), SubscriptionController.restorePurchases);

// --- Google Play Billing Endpoints (Phase 6) ---
router.post("/billing/verify-purchase", authMiddleware(true), BillingController.verifyPurchase);
router.get("/billing/status", BillingController.getBillingStatus);

// --- AI Credit & Usage Endpoints (Phase 6) ---
router.get("/credits/balance", authMiddleware(true), CreditController.getBalance);
router.get("/credits/history", authMiddleware(true), CreditController.getHistory);

// --- Admin Dashboard Endpoints (Phase 6) ---
router.get("/admin/overview", authMiddleware(true), requireAdmin, AdminController.getOverview);
router.get("/admin/users", authMiddleware(true), requireAdmin, AdminController.searchUsers);
router.get("/admin/users/:userId", authMiddleware(true), requireAdmin, AdminController.getUserDetails);
router.post("/admin/users/:userId/suspend", authMiddleware(true), requireAdmin, AdminController.suspendUser);
router.post("/admin/users/:userId/credits", authMiddleware(true), requireAdmin, AdminController.adjustCredits);
router.post("/admin/users/:userId/role", authMiddleware(true), requireAdmin, AdminController.setUserRole);
router.get("/admin/analytics/ai", authMiddleware(true), requireAdmin, AdminController.getAIAnalytics);
router.get("/admin/audit-logs", authMiddleware(true), requireAdmin, AdminController.getAuditLogs);

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
