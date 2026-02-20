
import express, { Application } from "express";
import { traceIdMiddleware } from "./middleware/traceId";
import { requestLoggerMiddleware } from "./middleware/requestLoggerMiddleware";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";
import healthRouter from "./routes/healthRouter";
import accountRouter from './routes/accountRouter';

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

export const createApp = (): Application => {
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET environment variable");
  }

  const app = express();

  app.use(express.json());
  app.use(traceIdMiddleware);
  app.use(requestLoggerMiddleware);

  app.use("/health", healthRouter);
  app.use("/accounts", accountRouter);
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
