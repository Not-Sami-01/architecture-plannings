import { APP } from "@/config/constants";

/**
 * Money is stored as integers; format only here at the UI boundary
 * (AGENTS.md, Architecture Rules #6).
 */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat(APP.locale, {
    style: "currency",
    currency: APP.currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** 1234567 → "1.2 MB"; used in file lists. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"] as const;
  let value = bytes;
  let unitIndex = -1;
  do {
    value /= 1024;
    unitIndex += 1;
  } while (value >= 1024 && unitIndex < units.length - 1);
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unitIndex]}`;
}
