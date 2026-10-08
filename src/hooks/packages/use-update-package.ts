"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { DEFAULT_ERROR_MESSAGE, API_ROUTES } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";
import type { UpdatePackageInput } from "@/lib/validators/admin-packages";

import type { AdminPackage } from "./use-admin-packages";
import { packageKeys } from "./package-keys";

/** PATCH /api/admin/packages/:id — edits a package (content, price, active flag). */
export function useUpdatePackage() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdatePackageInput;
    }): Promise<AdminPackage> => {
      const result = await api<AdminPackage>("patch", {
        url: API_ROUTES.adminPackage(id),
        body: input,
      });
      return result.data as AdminPackage;
    },
    onSuccess: (pkg) => {
      queryClient.invalidateQueries({ queryKey: packageKeys.all });
      toast.success(`Package “${pkg.name}” updated.`);
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
