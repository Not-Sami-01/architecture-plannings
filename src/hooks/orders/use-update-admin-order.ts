"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";
import type { AdminOrderUpdateInput } from "@/lib/validators/admin-orders";

import { adminOrderKeys } from "./admin-order-keys";

/** PATCH /api/admin/orders/:id — edit order fields (never status or price). */
export function useUpdateAdminOrder() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: AdminOrderUpdateInput;
    }): Promise<void> => {
      await api("patch", { url: API_ROUTES.adminOrder(id), body: input });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.detail(variables.id) });
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "admin-orders" && query.queryKey[1] === "list",
      });
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE);
    },
  });

  return {
    data: undefined,
    loadings: {
      updating: mutation.isPending,
    },
    actions: {
      update: mutation.mutateAsync,
    },
    query: mutation,
  };
}
