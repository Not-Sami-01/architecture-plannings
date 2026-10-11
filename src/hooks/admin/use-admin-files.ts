"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client/api";
import { API_ROUTES } from "@/config/constants";

import { adminFileKeys } from "./admin-file-keys";

export type AdminFileRow = {
  id: string;
  filename: string;
  mime: string;
  size: number;
  kind: string;
  confirmedAt: string | null;
  createdAt: string;
  orderId: string | null;
  order: { id: string; number: string } | null;
  uploadedBy: { id: string; name: string | null; email: string } | null;
};

export type AdminFileFilters = { kind?: string; q?: string; page: number; pageSize: number };

/** GET /api/admin/files — global file listing with filters. */
export function useAdminFiles(filters: AdminFileFilters) {
  const query = useQuery({
    queryKey: adminFileKeys.list(filters),
    queryFn: async ({ signal }) => {
      const result = await api<AdminFileRow[]>("get", {
        url: API_ROUTES.adminFiles,
        params: {
          ...(filters.kind ? { kind: filters.kind } : {}),
          ...(filters.q ? { q: filters.q } : {}),
          page: filters.page,
          pageSize: filters.pageSize,
        },
        signal,
      });
      return result.data ?? [];
    },
    placeholderData: (previous) => previous,
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
