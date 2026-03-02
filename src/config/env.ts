import dotenv from "dotenv";

dotenv.config();

const parseNumber = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? defaultValue : parsed;
};

export type NodeEnvironment = "development" | "test" | "production";

export interface AppConfig {
  env: NodeEnvironment;
  port: number;
}

const config: AppConfig = {
  env: (process.env.NODE_ENV as NodeEnvironment) || "development",
  port: parseNumber(process.env.PORT, 3000)
};

export default config;
