
import config from "./config/env";
import { createApp } from "./app";
import { logger } from "./logging/logger"
import { connectRedis } from "./redis/redisClient";
import { setupProcessHandlers } from "./lifecycle";

export async function bootstrap() {
  await connectRedis();
  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info(`Mini Bank API is running on http://localhost:${config.port} in ${config.env} mode`);
  });
  setupProcessHandlers(server);
}

if (require.main === module) {
  bootstrap().catch((err) => {
    logger.error("Bootstrap failed", { err });
    process.exit(1);
  });
}