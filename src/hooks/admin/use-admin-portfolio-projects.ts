"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client/api";
import { API_ROUTES } from "@/config/constants";

import { portfolioKeys } from "./admin-portfolio-keys";

export type AdminPortfolioRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  plotSize: string;
  style: string;
  description: string | null;
  images: string[];
  featured: boolean;
  visible: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

/** GET /api/admin/portfolio — every project (hidden included), display order. */
export function useAdminPortfolioProjects() {
  const query = useQuery({
    queryKey: portfolioKeys.adminList(),
    queryFn: async ({ signal }) => {
      const result = await api<AdminPortfolioRow[]>("get", {
        url: API_ROUTES.adminPortfolio,
        signal,
      });
      return result.data ?? [];
    },
  });

  return {
    data: query.data ?? [],
    loadings: {
      loading: query.isPending,
      fetching: query.isFetching,
    },
    actions: {},
    query,
  };
}
