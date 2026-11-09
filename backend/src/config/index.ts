import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "4000", 10),
  apiPrefix: process.env.API_PREFIX || "/api/v1",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  fastApiUrl: process.env.FASTAPI_AI_URL || "http://localhost:8000",
  enableMongodb: process.env.ENABLE_MONGODB === "true",
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/artistry_ai",
  jwtSecret: process.env.JWT_SECRET || "artistry_ai_super_secure_jwt_secret_dev_only",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  uploadDir: path.resolve(__dirname, "../../", process.env.UPLOAD_DIR || "uploads"),
  maxFileSizeBytes: (parseInt(process.env.MAX_FILE_SIZE_MB || "25", 10)) * 1024 * 1024,
  providers: {
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  },
  googlePlay: {
    packageName: process.env.GOOGLE_PLAY_PACKAGE_NAME || "ai.artistry.studio",
    serviceAccountEmail: process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL || "",
    privateKey: process.env.GOOGLE_PLAY_PRIVATE_KEY || "",
    keyFilePath: process.env.GOOGLE_PLAY_KEY_FILE || "",
  },
};

if (config.env === "production" && (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes("dev_only"))) {
  console.warn("⚠️ [SECURITY WARNING] Production environment detected with default or missing JWT_SECRET! Ensure a 256-bit cryptographic secret is set.");
}
