import { logger } from "./logging/logger";
import { bootstrap } from "./server";


if (require.main === module) {
  bootstrap().catch((err) => {
    logger.error("Bootstrap failed", { err });
    process.exit(1);
  });
}