import { z } from "zod";

export const SketchConvertSchema = z.object({
  imageUri: z.string().min(1, "imageUri is required"),
  options: z.object({
    style: z.enum([
      "graphite",
      "charcoal",
      "ink",
      "lineart",
      "coloredpencil",
      "watercolor",
      "cartoon",
      "realistic",
    ]).default("graphite"),
    intensity: z.number().min(0).max(100).default(50),
    contrast: z.number().min(0).max(100).default(50),
    brightness: z.number().min(0).max(100).default(50),
    detailLevel: z.number().min(0).max(100).default(50),
    edgeStrength: z.number().min(0).max(100).default(50),
    grayscale: z.boolean().default(true),
    paperTexture: z.boolean().default(false),
  }).default({}),
});

export const DrawingAnalysisSchema = z.object({
  width: z.number().positive().default(800),
  height: z.number().positive().default(800),
  drawingUri: z.string().optional(),
  referenceUri: z.string().optional(),
});

export const ReferenceGenerateSchema = z.object({
  category: z.string().default("portraits"),
  customPrompt: z.string().optional(),
  style: z.string().default("realistic"),
  complexity: z.enum(["beginner", "intermediate", "master"]).default("intermediate"),
  aspectRatio: z.enum(["1:1", "4:3", "16:9", "3:4"]).default("1:1"),
});

export const PoseDetectionSchema = z.object({
  imageUri: z.string().optional(),
  width: z.number().positive().default(800),
  height: z.number().positive().default(800),
});

export const HandFootDetectionSchema = z.object({
  type: z.enum(["hand", "foot"]).default("hand"),
  imageUri: z.string().optional(),
  width: z.number().positive().default(800),
  height: z.number().positive().default(800),
});

export const LightingAnalysisSchema = z.object({
  imageUri: z.string().optional(),
  lightAngleDeg: z.number().min(0).max(360).default(45),
  width: z.number().positive().default(800),
  height: z.number().positive().default(800),
});

export const CompositionAnalysisSchema = z.object({
  imageUri: z.string().optional(),
  mode: z.enum(["thirds", "golden", "diagonal", "triangle"]).default("thirds"),
  width: z.number().positive().default(800),
  height: z.number().positive().default(800),
});

export const LineArtCleanSchema = z.object({
  imageUri: z.string().min(1, "imageUri is required"),
  options: z.object({
    binarizeThreshold: z.number().min(0).max(255).default(128),
    removeScannerGrain: z.boolean().default(true),
    enhanceContrast: z.boolean().default(true),
    smoothContours: z.boolean().default(true),
  }).default({}),
});

export const SegmentationSchema = z.object({
  imageUri: z.string().min(1, "imageUri is required"),
  tolerance: z.number().min(0).max(100).default(25),
  feathering: z.number().min(0).max(20).default(3),
});

export const ColorRecommendSchema = z.object({
  imageUri: z.string().optional(),
  harmonyType: z.enum([
    "complementary",
    "analogous",
    "triadic",
    "split_complementary",
    "monochromatic",
    "skintones",
  ]).default("complementary"),
  count: z.number().min(2).max(12).default(5),
});

export const MultiAngleGenerateSchema = z.object({
  subjectUri: z.string().optional(),
  prompt: z.string().default("Human character model"),
  characterStyle: z.enum(["realistic", "anime", "stylized", "mannequin"]).default("mannequin"),
  includeHeightGuides: z.boolean().default(true),
});

export const MistakeDetectSchema = z.object({
  drawingUri: z.string().optional(),
  subjectType: z.enum(["portrait", "figure", "perspective", "generic"]).default("portrait"),
});

export const ArtMentorSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string().optional(),
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
      timestamp: z.number().optional(),
    })
  ).min(1, "At least one message is required"),
  experienceMode: z.enum(["beginner", "professional"]).default("beginner"),
  topic: z.string().optional(),
});

export const VectorizeSchema = z.object({
  imageUri: z.string().min(1, "imageUri is required"),
  options: z.object({
    pathTolerance: z.number().min(0.5).max(10).default(2.5),
    curveSmoothness: z.number().min(0.1).max(5).default(1.0),
    cornerThreshold: z.number().min(10).max(90).default(45),
    exportSvgXml: z.boolean().default(true),
  }).default({}),
});

export const ProgressSyncSchema = z.object({
  userId: z.string().optional(),
  dimensions: z.object({
    proportions: z.number().min(0).max(100),
    linework: z.number().min(0).max(100),
    shading: z.number().min(0).max(100),
    perspective: z.number().min(0).max(100),
    anatomy: z.number().min(0).max(100),
    composition: z.number().min(0).max(100),
  }),
  overallScore: z.number().min(0).max(100),
  history: z.array(z.any()).default([]),
});

export const ReplaySyncSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().default("Drawing Replay"),
  strokeCount: z.number().default(0),
  totalDurationMs: z.number().default(0),
  events: z.array(z.any()).default([]),
});

export const VoiceProcessSchema = z.object({
  transcript: z.string().optional(),
  audioBase64: z.string().optional(),
  language: z.enum(["en", "ta"]).default("en"),
  currentScreen: z.string().optional(),
});

// --- Phase 6: Authentication & User Profile Schemas ---

export const RegisterSchema = z
  .object({
    email: z.string().email("Invalid email address").toLowerCase().trim(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    displayName: z.string().min(1, "Full name is required").max(60, "Name too long").trim(),
    consentTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms of service and privacy policy",
    }),
    language: z.enum(["en", "ta"]).default("en"),
    experienceMode: z.enum(["beginner", "professional"]).default("beginner"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
  deviceId: z.string().optional(),
});

export const GoogleLoginSchema = z.object({
  idToken: z.string().min(1, "Google ID token is required"),
  deviceId: z.string().optional(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const ChangePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(60).trim().optional(),
  avatarUrl: z.string().optional(),
  language: z.enum(["en", "ta"]).optional(),
  experienceMode: z.enum(["beginner", "professional"]).optional(),
  drawingPreferences: z
    .object({
      defaultBrush: z.string().optional(),
      smoothing: z.string().optional(),
      autoSaveIntervalMs: z.number().min(1000).max(60000).optional(),
    })
    .optional(),
});

export const VerifyPurchaseSchema = z.object({
  packageName: z.string().default("ai.artistry.studio"),
  productId: z.string().min(1, "Product ID is required"),
  purchaseToken: z.string().min(1, "Purchase token is required"),
  orderId: z.string().optional(),
});

export const AdminSuspendUserSchema = z.object({
  isSuspended: z.boolean(),
  reason: z.string().max(255).optional(),
});

export const AdminAdjustCreditsSchema = z.object({
  amount: z.number().int().refine((val) => val !== 0, {
    message: "Amount must be a non-zero integer",
  }),
  reason: z.string().min(3, "Reason must be at least 3 characters").max(255),
});

export const AdminSetRoleSchema = z.object({
  role: z.enum(["user", "artist", "admin"]),
});
