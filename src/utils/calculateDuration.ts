export function getDurationMs(start: bigint): number {
  const end = process.hrtime.bigint();
  return Number(end - start) / 1_000_000;
}