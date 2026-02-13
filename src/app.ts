
import express, { Application } from "express";
import healthRouter from "./routes/health.routes";
import { traceIdMiddleware } from "./middleware/traceId";
import { requestLoggerMiddleware } from "./middleware/requestLogger";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";
import accountRouter from './routes/accountRouter';

export const createApp = (): Application => {
  const app = express();

  app.use(express.json());
  app.use(traceIdMiddleware);
  app.use(requestLoggerMiddleware);

  app.use("/health", healthRouter);
  app.use("/accounts", accountRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
