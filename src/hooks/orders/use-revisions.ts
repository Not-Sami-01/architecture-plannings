"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client/api";
import { API_ROUTES } from "@/config/constants";

import { revisionKeys } from "./revision-keys";

export type OrderRevision = {
  id: string;
  number: number;
  status: string;
  message: string;
  extraFeeRequired: boolean;
  /** True once the order's EXTRA_REVISION charge is PAID (accept unlocked). */
  extraFeePaid: boolean;
  acceptedAt: string | null;
  createdAt: string;
  files: { id: string; filename: string; mime: string; size: number }[];
};

/** GET /api/orders/:id/revisions — both parties' view of the revision thread. */
export function useRevisions(orderId: string) {
  const query = useQuery({
    queryKey: revisionKeys.list(orderId),
    queryFn: async ({ signal }) => {
      const result = await api<OrderRevision[]>("get", {
        url: API_ROUTES.revisions(orderId),
        signal,
      });
      return result.data;
    },
    enabled: Boolean(orderId),
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
