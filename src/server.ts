// src/server.ts

import { createApp } from "./app";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Use PORT from env or default to 3000
const PORT = process.env.PORT || 3000;

// Create Express app instance
const app = createApp();

/**
 * Start the HTTP server.
 * In a larger application we keep server startup
 * here so that app.ts stays focused on configuring
 * the Express application only.
 */
app.listen(PORT, () => {
  console.log(`Mini Bank API is running on http://localhost:${PORT}`);
});
