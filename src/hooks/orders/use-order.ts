"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client/api";
import { API_ROUTES } from "@/config/constants";

import { orderKeys } from "./order-keys";

export type ClientOrderDetail = {
  id: string;
  number: string;
  status: string;
  plotWidth: number;
  plotLength: number;
  plotUnit: string;
  facing: string;
  roadSides: string[];
  city: string;
  floors: number;
  bedrooms: number;
  bathrooms: number;
  kitchenType: string;
  garage: boolean;
  lounge: boolean;
  extras: string | null;
  style: string;
  budget: number | null;
  notes: string | null;
  totalPrice: number | null;
  advancePercent: number;
  quoteMessage: string | null;
  createdAt: string;
  package: { name: string; revisionLimit: number };
  files: { id: string; filename: string; mime: string; size: number }[];
};

/** GET /api/orders/:id — ownership-safe client detail (404 for strangers' orders). */
export function useOrder(id: string) {
  const query = useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: async ({ signal }) => {
      const result = await api<ClientOrderDetail>("get", {
        url: API_ROUTES.order(id),
        signal,
      });
      return result.data;
    },
    enabled: Boolean(id),
  });

  return {
    data: query.data ?? null,
    loadings: {
      loading: query.isPending,
      fetching: query.isFetching,
    },
    actions: {},
    query,
  };
}
