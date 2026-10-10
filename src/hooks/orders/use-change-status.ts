"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE, ORDER_STATUS_LABELS } from "@/config/constants";
import type { OrderStatus } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";
import type { StatusChangeInput } from "@/lib/validators/admin-orders";

import { adminOrderKeys } from "./admin-order-keys";

type StatusResult = { id: string; status: OrderStatus };

/** POST /api/admin/orders/:id/status — validated by the status machine (409 on illegal moves). */
export function useChangeStatus() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: StatusChangeInput;
    }): Promise<StatusResult> => {
      const result = await api<StatusResult>("post", {
        url: API_ROUTES.adminOrderStatus(id),
        body: input,
      });
      return result.data as StatusResult;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.all });
      toast.success(`Status changed to “${ORDER_STATUS_LABELS[result.status]}”.`);
    },
    onError: (error) => {
      // Same stale-UI recovery: a rejected transition means the detail view is out of date.
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.all });
      toast.error(error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE);
    },
  });

  return {
    data: mutation.data,
    loadings: {
      changing: mutation.isPending,
    },
    actions: {
      change: mutation.mutateAsync,
    },
    query: mutation,
  };
}
