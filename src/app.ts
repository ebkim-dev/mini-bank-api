// src/app.ts

import express, { Application } from "express";
import healthRouter from "./routes/health.routes";
import { traceIdMiddleware } from "./middleware/traceId";
import { requestLoggerMiddleware } from "./middleware/requestLogger";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";
import accountRouter from './routes/accountRouter';

/**
 * createApp function is responsible for:
 *  - Creating an Express application instance
 *  - Registering global middlewares
 *  - Mounting all route handlers
 */
export const createApp = (): Application => {
  const app = express();

  // Parse JSON bodies
  app.use(express.json());

  // Attach a unique traceId to every request
  app.use(traceIdMiddleware);

  // Log every incoming request + response status/duration
  app.use(requestLoggerMiddleware);

  // === Register routes here ===
  app.use("/health", healthRouter);
  app.use("/accounts", accountRouter);

  // If no route matched above, this middleware converts it into a 404 error
  app.use(notFoundHandler);

  // Centralized error handler - must be the last middleware
  app.use(errorHandler);

  return app;
};
