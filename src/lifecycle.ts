import type { Server } from "http";
import { logger } from "./logging/logger"
import { redisClient } from "./redis/redisClient";

export function setupProcessHandlers(server: Server) {
  async function gracefulShutdown(code: number) {
    logger.info("Gracefully shutting down...");

    server.close(() => {
      redisClient.quit().finally(() => process.exit(code));
    });
  }

  process.on("SIGINT", () => {
    logger.info("Received SIGINT. Shutting down server...");
    gracefulShutdown(0);
  });
  process.on("SIGTERM", () => {
    logger.info("Received SIGTERM. Shutting down server...");
    gracefulShutdown(0);
  });

  process.on("uncaughtException", (err) => {
    logger.error("Uncaught exception", { 
      stack: (err as Error).stack, 
      message: (err as Error).message
    });
    gracefulShutdown(1);
  });

  process.on("unhandledRejection", (err) => {
    logger.error("Unhandled promise rejection", { err });
    gracefulShutdown(1);
  });
}