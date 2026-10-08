"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";
import { API_ROUTES } from "@/config/constants";
import type { OrderInput } from "@/lib/validators/order";

import { adminOrderKeys } from "./admin-order-keys";
import { orderKeys } from "./order-keys";

type CreatedOrder = { id: string; number: string; status: string };
export type { CreatedOrder };

/** POST /api/orders — submits the order form. */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: OrderInput): Promise<CreatedOrder> => {
      const result = await api<CreatedOrder>("post", {
        url: API_ROUTES.orders,
        body: input,
      });
      return result.data as CreatedOrder;
    },
    onSuccess: (order) => {
      // Both panels list orders under different key prefixes.
      queryClient.invalidateQueries({ queryKey: orderKeys.list() });
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.all });
      toast.success(`Order ${order.number} submitted!`);
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE);
    },
  });

  return {
    data: mutation.data,
    loadings: {
      creating: mutation.isPending,
    },
    actions: {
      create: mutation.mutateAsync,
    },
    query: mutation,
  };
}
