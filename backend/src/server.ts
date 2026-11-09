import mongoose from "mongoose";
import { app } from "./app";
import { config } from "./config";
import { logger } from "./utils/logger";

async function startServer() {
  if (config.enableMongodb) {
    try {
      logger.info("Connecting to MongoDB...", { uri: config.mongodbUri });
      await mongoose.connect(config.mongodbUri);
      logger.info("Connected to MongoDB successfully");
    } catch (err: any) {
      logger.warn("MongoDB connection failed, continuing in memory/offline mode", {
        error: err.message,
      });
    }
  } else {
    logger.info("Running in memory/local mode (ENABLE_MONGODB=false)");
  }

  const server = app.listen(config.port, () => {
    logger.info(`ARTISTRY AI Backend server running on port ${config.port}`, {
      env: config.env,
      prefix: config.apiPrefix,
    });
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
      logger.info("Server closed successfully.");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

if (require.main === module) {
  startServer().catch((err) => {
    logger.error("Failed to start server", { error: err.message });
    process.exit(1);
  });
}
