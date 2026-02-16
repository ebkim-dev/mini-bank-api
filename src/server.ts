
import config from "./config/env";
import { createApp } from "./app";
import { logger } from "./logging/logger"

const app = createApp();

app.listen(config.port, () => {
  logger.info(`Mini Bank API is running on http://localhost:${config.port} in ${config.env} mode`);
});

// Shutdown logs
process.on("SIGINT", () => {
  logger.info("Received SIGINT. Shutting down server...");
  process.exit(0);
});
process.on("SIGTERM", () => {
  logger.info("Received SIGTERM. Shutting down server...");
  process.exit(0);
});

// Error logs
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason });
});
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", { stack: (err as Error).stack, message: (err as Error).message });
  process.exit(1);
});
