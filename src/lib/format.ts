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
