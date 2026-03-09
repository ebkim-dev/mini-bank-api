import { logger } from "./logging/logger";
import { bootstrap } from "./bootstrap";


if (require.main === module) {
  bootstrap().catch((err) => {
    logger.error("Bootstrap failed", { err });
    process.exit(1);
  });
}