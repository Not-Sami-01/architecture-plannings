"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client/api";
import { API_ROUTES } from "@/config/constants";

import { paymentKeys } from "./payment-keys";

export type PaymentSummary = {
  id: string;
  type: "ADVANCE" | "FINAL" | "EXTRA_REVISION";
  amount: number;
  status: "PENDING" | "PAID" | "REJECTED";
  note: string | null;
  createdAt: string;
  updatedAt: string;
  proofFile: { id: string; filename: string; mime: string; size: number } | null;
};

/** GET /api/orders/:id/payments — client: own order; admin: any. */
export function useOrderPayments(orderId: string, enabled = true) {
  const query = useQuery({
    queryKey: paymentKeys.list(orderId),
    queryFn: async ({ signal }) => {
      const result = await api<PaymentSummary[]>("get", {
        url: API_ROUTES.payments(orderId),
        signal,
      });
      return result.data ?? [];
    },
    enabled: Boolean(orderId) && enabled,
  });

  return {
    data: query.data ?? [],
    loadings: {
      loading: query.isPending,
    },
    actions: {},
    query,
  };
}
