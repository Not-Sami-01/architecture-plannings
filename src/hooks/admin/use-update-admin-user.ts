"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";

import { adminUserKeys } from "./admin-user-keys";
import type { AdminUserRow } from "./use-admin-users";

/** PATCH /api/admin/users/:id — rename and/or change role (Clerk + DB sync). */
export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      name,
      role,
    }: {
      id: string;
      name?: string;
      role?: "CLIENT" | "ADMIN";
    }): Promise<AdminUserRow> => {
      const result = await api<AdminUserRow>("patch", {
        url: API_ROUTES.adminUser(id),
        body: {
          ...(name !== undefined ? { name } : {}),
          ...(role !== undefined ? { role } : {}),
        },
      });
      return result.data as AdminUserRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
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
