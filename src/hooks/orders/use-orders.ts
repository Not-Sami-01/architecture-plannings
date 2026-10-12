"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client/api";
import { API_ROUTES, PAGINATION } from "@/config/constants";
import type { OrderListQuery } from "@/lib/validators/order";

import { orderKeys } from "./order-keys";

export type OrderListItem = {
  id: string;
  number: string;
  status: string;
  city: string;
  createdAt: string;
  currency: string;
  totalPrice: number | null;
  package: { name: string };
};

export type OrdersMeta = {
  page: number;
  pageSize: number;
  total: number;
};

/** GET /api/orders — the signed-in client's orders, filtered and paginated. */
export function useOrders(filters: Partial<OrderListQuery> = {}) {
  const normalized = {
    status: filters.status ?? "",
    q: filters.q ?? "",
    sort: filters.sort ?? "newest",
    page: filters.page ?? PAGINATION.defaultPage,
    pageSize: filters.pageSize ?? PAGINATION.defaultPageSize,
  };

  const query = useQuery({
    queryKey: orderKeys.list(normalized),
    queryFn: async ({ signal }) => {
      const params: Record<string, string | number> = {
        sort: normalized.sort,
        page: normalized.page,
        pageSize: normalized.pageSize,
      };
      if (normalized.status) params.status = normalized.status;
      if (normalized.q) params.q = normalized.q;

      const result = await api<OrderListItem[]>("get", {
        url: API_ROUTES.orders,
        params,
        signal,
      });
      return {
        items: result.data ?? [],
        meta: result.meta ?? {
          page: normalized.page,
          pageSize: normalized.pageSize,
          total: 0,
        },
      };
    },
    // Keep the previous page visible while the next one loads (no blank flash).
    placeholderData: keepPreviousData,
  });

  return {
    data: query.data?.items ?? [],
    meta: query.data?.meta ?? {
      page: normalized.page,
      pageSize: normalized.pageSize,
      total: 0,
    },
    loadings: {
      loading: query.isPending,
      fetching: query.isFetching,
    },
    actions: {},
    query,
  };
}
