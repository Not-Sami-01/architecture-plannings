"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";

import { adminFileKeys } from "./admin-file-keys";
import type { AdminFileRow } from "./use-admin-files";

/** PATCH /api/admin/files/:id — rename or change kind. */
export function useUpdateAdminFile() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      filename,
      kind,
    }: {
      id: string;
      filename?: string;
      kind?: string;
    }): Promise<AdminFileRow> => {
      const result = await api<AdminFileRow>("patch", {
        url: API_ROUTES.adminFile(id),
        body: {
          ...(filename !== undefined ? { filename } : {}),
          ...(kind !== undefined ? { kind } : {}),
        },
      });
      return result.data as AdminFileRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminFileKeys.all });
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE);
    },
  });

  return {
    data: mutation.data,
    loadings: {
      updating: mutation.isPending,
    },
    actions: {
      update: mutation.mutateAsync,
    },
    query: mutation,
  };
}
