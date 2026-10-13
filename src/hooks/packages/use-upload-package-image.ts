"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";

import { packageKeys } from "./package-keys";

type UploadInput = { packageId: string; file: Blob };

/**
 * Pricing-card image (plan 5 A). POST/DELETE /api/admin/packages/:id/image —
 * multipart upload of the cropped blob; invalidates the catalog so cards and
 * the form preview refetch the new key.
 */
export function useUploadPackageImage() {
  const queryClient = useQueryClient();

  const upload = useMutation({
    mutationFn: async ({ packageId, file }: UploadInput) => {
      const form = new FormData();
      form.append("image", file, "card.jpg");
      const result = await api<{ imageKey: string | null }>("post", {
        url: `${API_ROUTES.adminPackage(packageId)}/image`,
        body: form,
      });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packageKeys.all });
      toast.success("Card image updated.");
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE);
    },
  });

  const clear = useMutation({
    mutationFn: async (packageId: string) => {
      const result = await api<{ imageKey: null }>("delete", {
        url: `${API_ROUTES.adminPackage(packageId)}/image`,
      });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packageKeys.all });
      toast.success("Card image removed.");
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE);
    },
  });

  return {
    loadings: {
      uploading: upload.isPending,
      clearing: clear.isPending,
    },
    actions: {
      upload: upload.mutateAsync,
      clear: clear.mutateAsync,
    },
    query: upload,
  };
}
