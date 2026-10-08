"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client/api";
import { API_ROUTES } from "@/config/constants";
import type { AdminOrderListQuery } from "@/lib/validators/admin-orders";

import { adminOrderKeys } from "./admin-order-keys";

export type AdminOrderRow = {
  id: string;
  number: string;
  status: string;
  city: string;
  createdAt: string;
  quotedAt: string | null;
  totalPrice: number | null;
  package: { name: string };
  user: { id: string; name: string | null; email: string };
  _count: { files: number };
};

export type PaginatedMeta = {
  page: number;
  pageSize: number;
  total: number;
};

/** GET /api/admin/orders — filtered, paginated list. */
export function useAdminOrders(filters: Partial<AdminOrderListQuery>) {
  const normalized = {
    status: filters.status ?? "",
    q: filters.q ?? "",
    sort: filters.sort ?? "newest",
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 20,
  };

  const query = useQuery({
    queryKey: adminOrderKeys.list(normalized),
    queryFn: async ({ signal }) => {
      const params: Record<string, string | number> = {
        sort: normalized.sort,
        page: normalized.page,
        pageSize: normalized.pageSize,
      };
      if (normalized.status) params.status = normalized.status;
      if (normalized.q) params.q = normalized.q;

      const result = await api<AdminOrderRow[]>("get", {
        url: API_ROUTES.adminOrders,
        params,
        signal,
      });
      return {
        items: result.data ?? [],
        meta: result.meta ?? { page: 1, pageSize: normalized.pageSize, total: 0 },
      };
    },
  });

  return {
    data: query.data?.items ?? [],
    meta: query.data?.meta ?? { page: 1, pageSize: normalized.pageSize, total: 0 },
    loadings: {
      loading: query.isPending,
      fetching: query.isFetching,
    },
    actions: {},
    query,
  };
}
