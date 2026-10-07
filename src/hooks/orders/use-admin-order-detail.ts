"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client/api";
import { API_ROUTES } from "@/config/constants";

import { adminOrderKeys } from "./admin-order-keys";

export type AdminEventRow = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  createdAt: string;
};

export type AdminRevisionRow = {
  id: string;
  number: number;
  status: string;
  createdAt: string;
};

export type AdminPaymentRow = {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
};

export type AdminOrderDetail = {
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
  quotedAt: string | null;
  revisionCount: number;
  finalPaymentVerified: boolean;
  createdAt: string;
  package: { id: string; name: string; price: number; revisionLimit: number; deliverables: string[] };
  user: { id: string; name: string | null; email: string };
  files: { id: string; filename: string; mime: string; size: number; kind: string; createdAt: string }[];
  events: AdminEventRow[];
  revisions: AdminRevisionRow[];
  payments: AdminPaymentRow[];
};

/** GET /api/admin/orders/:id — full detail for the admin order page. */
export function useAdminOrderDetail(id: string) {
  const query = useQuery({
    queryKey: adminOrderKeys.detail(id),
    queryFn: async ({ signal }) => {
      const result = await api<AdminOrderDetail>("get", {
        url: API_ROUTES.adminOrder(id),
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
