"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client/api";
import { API_ROUTES, APP } from "@/config/constants";

import { settingsKeys } from "./settings-keys";

export type SiteSettings = {
  currency: string;
};

/**
 * GET /api/settings — public app settings (plan 3). The admin's currency
 * change publishes `settings.updated`, which invalidates this key so every
 * open tab re-renders money labels live.
 */
export function useSettings() {
  const query = useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: async ({ signal }) => {
      const result = await api<SiteSettings>("get", {
        url: API_ROUTES.settings,
        signal,
      });
      return result.data ?? { currency: APP.currency };
    },
    // Currency changes are rare; pick them up quickly on remount.
    staleTime: 30_000,
  });

  return {
    data: query.data,
    loadings: {
      loading: query.isPending,
    },
    actions: {},
    query,
  };
}
