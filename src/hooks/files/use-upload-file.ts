"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

import {
  CLIENT_MIME_TYPES,
  DEFAULT_ERROR_MESSAGE,
  FILE_LIMITS,
} from "@/config/constants";
import { ApiClientError, api } from "@/lib/api-client/api";
import { API_ROUTES } from "@/config/constants";

import { filesKeys } from "./upload-keys";

/**
 * RULES.md §10: presign → direct upload → confirm, exposed through the
 * standard four-key structure. The raw PUT to the presigned URL is the one
 * sanctioned sibling call to `api` (axios used here, never imported by
 * components) because the URL is provider-signed, not an app endpoint.
 */

export type UploadFileInput = {
  file: File;
  kind: "CLIENT" | "REVISION_REF";
  onProgress?: (percent: number) => void;
};

export type UploadedFile = {
  id: string;
  filename: string;
  size: number;
  mime: string;
};

type PresignResponse = {
  fileId: string;
  url: string;
  method: "PUT" | "LOCAL";
  expiresIn: number;
};

export function useUploadFile() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: UploadFileInput): Promise<UploadedFile> => {
      const { file, kind, onProgress } = input;

      // Client-side pre-checks from constants (RULES.md §10). Admin mime
      // extensions are intentionally not allowed through this client hook.
      const allowed = CLIENT_MIME_TYPES;
      if (!allowed.includes(file.type as (typeof allowed)[number])) {
        throw new ApiClientError(415, "This file type is not allowed.", "UNSUPPORTED_FILE_TYPE");
      }
      if (file.size > FILE_LIMITS.clientMaxSizeBytes) {
        throw new ApiClientError(413, "The file is too large (max 10 MB).", "FILE_TOO_LARGE");
      }

      const presign = await api<PresignResponse>("post", {
        url: API_ROUTES.filesPresign,
        body: { filename: file.name, mime: file.type, size: file.size, kind },
      });

      // Direct upload to storage (or the local fallback endpoint).
      await axios.put(presign.data.url, file, {
        headers: { "Content-Type": file.type },
        withCredentials: presign.data.method === "LOCAL",
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        },
      });

      const confirmed = await api<UploadedFile>("post", {
        url: API_ROUTES.filesConfirm,
        body: { fileId: presign.data.fileId },
      });

      return confirmed.data as UploadedFile;
    },
    onSuccess: (uploaded) => {
      queryClient.invalidateQueries({ queryKey: filesKeys.mine() });
      toast.success(`${uploaded.filename} uploaded`);
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE);
    },
  });

  return {
    data: mutation.data,
    loadings: {
      uploading: mutation.isPending,
    },
    actions: {
      upload: mutation.mutateAsync,
      reset: mutation.reset,
    },
    query: mutation,
  };
}

export type UseUploadFileReturn = ReturnType<typeof useUploadFile>;
