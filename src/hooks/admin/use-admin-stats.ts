"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client/api";
import { API_ROUTES } from "@/config/constants";

import { adminStatsKeys } from "./admin-stats-keys";

export type AdminStatsData = {
  statusCounts: Record<string, number>;
  // Grouped per currency — orders snapshot their own (plan 5 B).
  revenue: {
    byCurrency: Record<
      string,
      {
        totalPaid: number;
        advancePaid: number;
        finalPaid: number;
        extraRevisionPaid: number;
        thisMonthPaid: number;
      }
    >;
  };
  needsAttention: {
    submitted: number;
    awaitingAdvance: number;
    inDesign: number;
    draftDelivered: number;
    awaitingFinalPayment: number;
    pendingPayments: number;
    openRevisions: number;
  };
  recentOrders: Array<{
    id: string;
    number: string;
    status: string;
    createdAt: string;
    clientName: string | null;
    clientEmail: string;
    packagePrice: number;
    currency: string;
  }>;
  avgRevisionsPerCompletedOrder: number;
};

/** GET /api/admin/stats — the dashboard overview (plan 3 P7). */
export function useAdminStats() {
  const query = useQuery({
    queryKey: adminStatsKeys.detail(),
    queryFn: async ({ signal }) => {
      const result = await api<AdminStatsData>("get", {
        url: API_ROUTES.adminStats,
        signal,
      });
      return result.data;
    },
  });

  return {
    data: query.data,
    loadings: {
      loading: query.isPending,
    },
    actions: {},
    query,
  };
}
