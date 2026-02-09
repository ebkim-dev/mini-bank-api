// src/utils/logger.ts

/**
 * Very simple logger abstraction over console.
 * The reason we wrap console.log is:
 *  - We can centralize formatting of log messages
 *  - Later we can replace this with a proper logger (winston/pino)
 *    without touching the rest of the code.
 */

interface LogMeta {
  traceId?: string | undefined;
  [key: string]: unknown;
}

/**
 * Formats metadata as a JSON string for consistent logs.
 */
const formatMeta = (meta?: LogMeta): string => {
  if (!meta) return "";
  // Remove undefined values for cleaner logs
  const cleaned: Record<string, unknown> = {};
  Object.entries(meta).forEach(([key, value]) => {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  });

  const json = JSON.stringify(cleaned);
  return json === "{}" ? "" : ` ${json}`;
};

export const logInfo = (message: string, meta?: LogMeta): void => {
  console.log(`[INFO] ${message}${formatMeta(meta)}`);
};

export const logError = (message: string, meta?: LogMeta): void => {
  console.error(`[ERROR] ${message}${formatMeta(meta)}`);
};
