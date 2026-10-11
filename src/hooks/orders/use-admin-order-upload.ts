"use client";

import { useState } from "react";

import type { FileKind } from "@/config/constants";
import { uploadToStorage, type UploadedFile } from "@/lib/api-client/upload";

/**
 * Admin uploads to an existing order (plan Phase D4): kind picker, multi-file,
 * per-file progress via uploadToStorage with orderId.
 */
export function useAdminOrderUpload(orderId: string) {
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);

  const uploadFiles = async (files: readonly File[], kind: FileKind): Promise<UploadedFile[]> => {
    setUploading(true);
    setProgress({});
    try {
      const uploaded: UploadedFile[] = [];
      for (const file of files) {
        uploaded.push(
          await uploadToStorage({
            file,
            kind,
            orderId,
            isAdmin: true,
            onProgress: (percent) => setProgress((current) => ({ ...current, [file.name]: percent })),
          }),
        );
      }
      return uploaded;
    } finally {
      setUploading(false);
    }
  };

  return {
    data: progress,
    loadings: {
      uploading,
    },
    actions: {
      uploadFiles,
    },
    query: {},
  };
}
