"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client/api";
import { API_ROUTES } from "@/config/constants";

import { orderKeys } from "./order-keys";

export type OrderListItem = {
  id: string;
  number: string;
  status: string;
  city: string;
  createdAt: string;
  package: { name: string };
  user: { name: string | null; email: string };
};

/** GET /api/orders — the signed-in client's orders. */
export function useOrders() {
  const query = useQuery({
    queryKey: orderKeys.list(),
    queryFn: async ({ signal }) => {
      const result = await api<OrderListItem[]>("get", {
        url: API_ROUTES.orders,
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
