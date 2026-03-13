
import express, { Application } from "express";
import { traceIdMiddleware } from "./middleware/traceIdMiddleware";
import { requestLoggerMiddleware } from "./middleware/requestLoggerMiddleware";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";
import healthRouter from "./health/healthRouter";
import accountRouter from './account/accountRouter';
import authRouter from './auth/authRouter';
import transactionRouter from './transaction/transactionRouter';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

export const createApp = (): Application => {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not defined");
  }

  const app = express();

  app.use(express.json());
  app.use(traceIdMiddleware);
  app.use(requestLoggerMiddleware);

  app.use("/auth", authRouter);
  app.use("/health", healthRouter);
  app.use("/accounts", accountRouter);
  app.use("/transactions",transactionRouter);
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
