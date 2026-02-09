// src/routes/health.routes.ts

import { Router, Request, Response } from "express";

const router = Router();

/**
 * GET /health
 *
 * Basic health check endpoint.
 * This is usually the first thing we implement
 * to confirm that our service is up and running.
 *
 * Later we can extend this to include checks for:
 *  - Database connectivity
 *  - Redis connectivity
 *  - Version/build information
 */
router.get("/", (req: Request, res: Response) => {
  const healthInfo = {
    status: "ok",
    service: "mini-bank-api",
    // process.uptime() returns number of seconds this process has been running
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };

  res.status(200).json(healthInfo);
});

export default router;
