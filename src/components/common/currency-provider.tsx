"use client";

import { createContext, useContext } from "react";

import { APP } from "@/config/constants";

import { useSettings } from "@/hooks/settings/use-settings";

/**
 * Live site currency for client components (plan 3). Server components read
 * `getSiteSettings()` directly; order-scoped UI should prefer the order's
 * own snapshot (`formatMoney(x, order.currency)`).
 */
const CurrencyContext = createContext<string>(APP.currency);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const settings = useSettings();
  return (
    <CurrencyContext.Provider value={settings.data?.currency ?? APP.currency}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): string {
  return useContext(CurrencyContext);
}
