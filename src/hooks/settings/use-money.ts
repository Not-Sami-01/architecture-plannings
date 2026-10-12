"use client";

import { useCallback } from "react";

import { useCurrency } from "@/components/common/currency-provider";
import { formatMoney } from "@/lib/format";

/**
 * Bound money formatter for client components (plan 3): uses the live site
 * currency from CurrencyProvider. Order-scoped screens pass the order's
 * snapshot explicitly instead — `formatMoney(amount, order.currency)`.
 */
export function useMoney() {
  const currency = useCurrency();
  return useCallback(
    (amount: number) => formatMoney(amount, currency),
    [currency],
  );
}
