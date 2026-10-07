"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client/api";
import { API_ROUTES } from "@/config/constants";

import { authKeys } from "./auth-keys";

export type AppSessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: "CLIENT" | "ADMIN";
};

/** GET /api/session — null when signed out. */
export function useSession() {
  const query = useQuery({
    queryKey: authKeys.session(),
    queryFn: async ({ signal }) => {
      const result = await api<AppSessionUser | null>("get", {
        url: API_ROUTES.session,
        signal,
      });
      return result.data ?? null;
    },
    staleTime: 5 * 60_000,
  });

  return {
    data: query.data ?? null,
    loadings: {
      loading: query.isPending,
    },
    actions: {},
    query,
  };
}
