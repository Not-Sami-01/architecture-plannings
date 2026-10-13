"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";

type UploadInput = { file: Blob; filename?: string };

/**
 * Portfolio gallery upload (Phase 5). POST /api/admin/portfolio/images —
 * multipart of a cropped 1200×900 blob; returns `{ id, url }` for the
 * project's `images` array.
 */
export function useUploadPortfolioImage() {
  const upload = useMutation({
    mutationFn: async ({ file, filename }: UploadInput): Promise<{ id: string; url: string }> => {
      const form = new FormData();
      form.append("image", file, filename ?? "image.jpg");
      const result = await api<{ id: string; url: string }>("post", {
        url: API_ROUTES.adminPortfolioImage,
        body: form,
      });
      return result.data as { id: string; url: string };
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE);
    },
  });

  return {
    loadings: { uploading: upload.isPending },
    actions: { upload: upload.mutateAsync },
    query: upload,
  };
}
