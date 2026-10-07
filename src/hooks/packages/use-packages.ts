"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client/api";
import { API_ROUTES } from "@/config/constants";

import { packageKeys } from "./package-keys";

export type PackageSummary = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  revisionLimit: number;
  deliverables: string[];
};

/** GET /api/packages — active packages for the order form and pricing UI. */
export function usePackages() {
  const query = useQuery({
    queryKey: packageKeys.list(),
    queryFn: async ({ signal }) => {
      const result = await api<PackageSummary[]>("get", {
        url: API_ROUTES.packages,
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
