"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";

import { adminOrderKeys } from "./admin-order-keys";
import { orderKeys } from "./order-keys";
import { adminStatsKeys } from "@/hooks/admin/admin-stats-keys";

/** POST /api/admin/orders/:id/finals — register final files (plan 3 P3/P6). */
export function useAdminRegisterFinals(orderId?: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: { fileIds: string[] }) => {
      if (!orderId) throw new Error("Order id is required.");
      await api("post", {
        url: API_ROUTES.adminFinals(orderId),
        body: input,
      });
    },
    onSuccess: () => {
      if (orderId) {
        void queryClient.invalidateQueries({ queryKey: adminOrderKeys.detail(orderId) });
        void queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
        void queryClient.invalidateQueries({ queryKey: adminStatsKeys.all });
      }
      toast.success("Final files registered. Clients unlock them after the final payment.");
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE);
    },
  });

  return {
    data: mutation.data,
    loadings: {
      saving: mutation.isPending,
    },
    actions: {
      save: mutation.mutateAsync,
    },
    query: mutation,
  };
}
