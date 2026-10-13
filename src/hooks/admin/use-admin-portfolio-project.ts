"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client/api";
import { API_ROUTES } from "@/config/constants";

import { portfolioKeys } from "./admin-portfolio-keys";
import type { AdminPortfolioRow } from "./use-admin-portfolio-projects";

/** GET /api/admin/portfolio/:id — full record for the edit form. */
export function useAdminPortfolioProject(id: string | null) {
  const query = useQuery({
    queryKey: portfolioKeys.adminProject(id ?? ""),
    enabled: Boolean(id),
    queryFn: async ({ signal }) => {
      const result = await api<AdminPortfolioRow>("get", {
        url: API_ROUTES.adminPortfolioItem(id as string),
        signal,
      });
      return result.data as AdminPortfolioRow;
    },
  });

  return {
    data: query.data ?? null,
    loadings: { loading: query.isPending },
    actions: {},
    query,
  };
}
