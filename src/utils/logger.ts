interface LogMeta {
  traceId?: string | undefined;
  [key: string]: unknown;
}

const formatMeta = (meta?: LogMeta): string => {
  if (!meta) return "";
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
