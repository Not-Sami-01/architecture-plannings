"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";

import { adminOrderKeys } from "./admin-order-keys";
import { adminStatsKeys } from "@/hooks/admin/admin-stats-keys";

type AcceptRevisionResult = {
  orderId: string;
  status: string;
  revisionId: string;
  number: number;
};

/** PATCH /api/admin/revisions/:id `{ action: "accept" }` (plan 3 P4). */
export function useAdminAcceptRevision() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (revisionId: string): Promise<AcceptRevisionResult> => {
      const result = await api<AcceptRevisionResult>("patch", {
        url: API_ROUTES.adminRevision(revisionId),
        body: { action: "accept" },
      });
      return result.data as AcceptRevisionResult;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: adminOrderKeys.detail(data.orderId) });
      void queryClient.invalidateQueries({ queryKey: adminStatsKeys.all });
      toast.success(`Revision #${data.number} accepted — back to design.`);
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE);
    },
  });

  return {
    data: mutation.data,
    loadings: {
      accepting: mutation.isPending,
    },
    actions: {
      accept: mutation.mutateAsync,
    },
    query: mutation,
  };
}
