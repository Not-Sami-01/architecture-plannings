"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";

/** DELETE /api/admin/orders/:id — hard delete (rows + storage), destructive. */
export function useDeleteAdminOrder() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: string }): Promise<void> => {
      await api("delete", { url: API_ROUTES.adminOrder(id) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "admin-orders",
      });
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE);
    },
  });

  return {
    data: undefined,
    loadings: {
      deleting: mutation.isPending,
    },
    actions: {
      remove: mutation.mutateAsync,
    },
    query: mutation,
  };
}
