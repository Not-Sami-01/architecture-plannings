"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { API_ROUTES } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";
import type { CreatePackageInput } from "@/lib/validators/admin-packages";

import type { AdminPackage } from "./use-admin-packages";
import { packageKeys } from "./package-keys";

/** POST /api/admin/packages — creates a pricing package. */
export function useCreatePackage() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: CreatePackageInput): Promise<AdminPackage> => {
      const result = await api<AdminPackage>("post", {
        url: API_ROUTES.adminPackages,
        body: input,
      });
      return result.data as AdminPackage;
    },
    onSuccess: (pkg) => {
      queryClient.invalidateQueries({ queryKey: packageKeys.all });
      toast.success(`Package “${pkg.name}” created.`);
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
