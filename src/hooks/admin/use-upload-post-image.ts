"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { API_ROUTES, DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";

type UploadInput = { file: Blob; filename?: string };

/**
 * Blog image upload (plan 6). POST /api/admin/posts/images — multipart of the
 * cropped cover (or a TipTap inline image); returns `{ id, url }` where the
 * url is the public `/api/posts/images/:id` path used in stored HTML.
 */
export function useUploadPostImage() {
  const upload = useMutation({
    mutationFn: async ({ file, filename }: UploadInput): Promise<{ id: string; url: string }> => {
      const form = new FormData();
      form.append("image", file, filename ?? "image.jpg");
      const result = await api<{ id: string; url: string }>("post", {
        url: API_ROUTES.adminPostImages,
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
