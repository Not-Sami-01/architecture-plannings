"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client/api";
import { API_ROUTES } from "@/config/constants";

import { adminUserKeys } from "./admin-user-keys";

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
  role: "CLIENT" | "ADMIN";
  createdAt: string;
  ordersCount: number;
};

export type AdminUserFilters = { q?: string; role?: string; page: number; pageSize: number };

/** GET /api/admin/users — search, role filter, pagination. */
export function useAdminUsers(filters: AdminUserFilters) {
  const query = useQuery({
    queryKey: adminUserKeys.list(filters),
    queryFn: async ({ signal }) => {
      const result = await api<AdminUserRow[]>("get", {
        url: API_ROUTES.adminUsers,
        params: {
          ...(filters.q ? { q: filters.q } : {}),
          ...(filters.role ? { role: filters.role } : {}),
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
