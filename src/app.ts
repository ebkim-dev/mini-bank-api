
import express, { Application } from "express";
import healthRouter from "./routes/health.routes";
import { traceIdMiddleware } from "./middleware/traceId";
import { requestLoggerMiddleware } from "./middleware/requestLogger";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";
import accountRouter from './routes/accountRouter';

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

export const createApp = (): Application => {
  const app = express();
  
  console.log("Swagger spec loaded?", swaggerSpec ? "YES" : "NO");

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
