"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";

import { adminFileKeys } from "./admin-file-keys";

/** DELETE /api/admin/files/:id — purge row + storage object (destructive). */
export function useDeleteAdminFile() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id }: { id: string }): Promise<void> => {
      await api("delete", { url: API_ROUTES.adminFile(id) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminFileKeys.all });
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
