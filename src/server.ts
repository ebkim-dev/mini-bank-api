// src/server.ts

import { createApp } from "./app";
import config from "./config/env";

// Create Express app instance
const app = createApp();

/**
 * Start the HTTP server.
 * We now use the centralized config object for environment-related
 * values such as port and runtime environment (NODE_ENV).
 */
app.listen(config.port, () => {
  console.log(
    `Mini Bank API is running on http://localhost:${config.port} in ${config.env} mode`
  );
});
