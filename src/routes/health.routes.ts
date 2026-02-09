import { Router, Request, Response } from "express";
import { BadRequestError } from "../utils/error";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  // Optional: if you call /health?fail=true we simulate an error
  if (req.query.fail === "true") {
    throw BadRequestError("HEALTH_CHECK_FAILED", "Health check forced to fail");
  }

  const payload = {
    status: "ok",
    service: "mini-bank-api",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };

  res.status(200).json(payload);
});

export default router;
