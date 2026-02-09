// src/config/env.ts

import dotenv from "dotenv";

// Load variables from .env file into process.env
// This will only run once, the first time this file is imported.
dotenv.config();

/**
 * Simple helper to safely parse environment variables that should be numbers.
 * If parsing fails or value is missing, we return a provided default.
 */
const parseNumber = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Supported runtime environments.
 * You can extend this as needed (e.g. "staging").
 */
export type NodeEnvironment = "development" | "test" | "production";

/**
 * Core application configuration shape.
 * Later we will extend this with:
 *  - Database settings
 *  - Redis settings
 *  - Any other shared config
 */
export interface AppConfig {
  env: NodeEnvironment;
  port: number;
  // db?: { ... }         // will add in DB feature
  // redis?: { ... }      // will add in Redis feature
}

/**
 * Build configuration object from process.env.
 * We keep all default values and parsing logic here so that
 * the rest of the application can just use `config` without
 * worrying about environment variables directly.
 */
const config: AppConfig = {
  env: (process.env.NODE_ENV as NodeEnvironment) || "development",
  port: parseNumber(process.env.PORT, 3000)
};

export default config;
