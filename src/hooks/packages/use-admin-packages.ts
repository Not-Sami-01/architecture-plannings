"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client/api";
import { API_ROUTES } from "@/config/constants";

import { packageKeys } from "./package-keys";

export type AdminPackage = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  revisionLimit: number;
  deliverables: string[];
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

/** GET /api/admin/packages — full catalog for the pricing panel (incl. inactive). */
export function useAdminPackages() {
  const query = useQuery({
    queryKey: packageKeys.adminList(),
    queryFn: async ({ signal }) => {
      const result = await api<AdminPackage[]>("get", {
        url: API_ROUTES.adminPackages,
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
