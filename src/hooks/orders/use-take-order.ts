"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";

import { adminOrderKeys } from "./admin-order-keys";

/** POST /api/admin/orders/:id/take — assign current admin or release. */
export function useTakeOrder() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, take }: { id: string; take: boolean }): Promise<void> => {
      await api("post", { url: API_ROUTES.adminOrderTake(id), body: { take } });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.detail(variables.id) });
      for (const key of queryClient.getQueryCache().getAll().map((entry) => entry.queryKey)) {
        if (key[0] === "admin-orders" && key[1] === "list") {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE);
    },
  });

  return {
    data: undefined,
    loadings: {
      taking: mutation.isPending,
    },
    actions: {
      take: mutation.mutateAsync,
    },
    query: mutation,
  };
}
