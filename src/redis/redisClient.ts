import { createClient } from "redis";
import { logger } from "../logging/logger";

export const redisClient = createClient({
  url: "redis://localhost:6379"
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    logger.info("Redis connected");
  }
}

export async function disconnectRedis() {
  if (redisClient.isOpen) {
    await redisClient.quit();
    logger.info("Redis disconnected");
  }
}
