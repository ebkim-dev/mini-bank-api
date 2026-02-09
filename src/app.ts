// src/app.ts

import express, { Application } from "express";
import dotenv from "dotenv";
import healthRouter from "./routes/health.routes";

// Load environment variables from .env file into process.env
dotenv.config();

/**
 * createApp function is responsible for:
 *  - Creating an Express application instance
 *  - Registering global middlewares
 *  - Mounting all route handlers
 *
 * Keeping this in a separate file from server.ts
 * makes it easier to test the app without actually
 * starting the HTTP server.
 */
export const createApp = (): Application => {
  const app = express();

  // Built-in middleware to parse JSON request bodies
  app.use(express.json());

  // Mount route modules
  // We can later add /api prefix here if needed
  app.use("/health", healthRouter);

  return app;
};
