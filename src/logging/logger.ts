import winston from "winston";

const isTest = process.env.NODE_ENV === "test";

export const logger = winston.createLogger({
  silent: isTest, // If you want to see test logs, comment this line out!
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});
