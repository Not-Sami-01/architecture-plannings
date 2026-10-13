"use client";

import { useState } from "react";

import type { FileKind } from "@/config/constants";
import { stageOrderFiles, type StagedFile, type StagedRejection } from "@/lib/staged-files";
import { uploadToStorage, type UploadedFile } from "@/lib/api-client/upload";

/**
 * Admin uploads are staged first (plan 5 C): pick/drop files into a local
 * queue, remove mistakes, then submit the batch explicitly. Nothing touches
 * storage until `uploadAll` runs — no more one-click accidental sends.
 */
export function useStagedAdminUpload(orderId: string) {
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [rejected, setRejected] = useState<StagedRejection[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);

  const stage = (incoming: FileList | File[] | null) => {
    if (!incoming?.length) return;
    const result = stageOrderFiles(staged, Array.from(incoming), { isAdmin: true });
    setStaged(result.staged);
    setRejected(result.rejected);
  };

  const remove = (key: string) => {
    setStaged((current) => current.filter((file) => file.key !== key));
    setRejected([]);
  };

  const clear = () => {
    setStaged([]);
    setRejected([]);
    setProgress({});
  };

  const uploadAll = async (kind: FileKind): Promise<UploadedFile[]> => {
    if (!staged.length || uploading) return [];
    setUploading(true);
    setProgress({});
    try {
      const uploaded: UploadedFile[] = [];
      for (const item of staged) {
        uploaded.push(
          await uploadToStorage({
            file: item.file,
            kind,
            orderId,
            isAdmin: true,
            onProgress: (percent) =>
              setProgress((current) => ({ ...current, [item.name]: percent })),
          }),
        );
      }
      clear();
      return uploaded;
    } finally {
      setUploading(false);
    }
  };

  return {
    data: { staged, rejected, progress },
    loadings: { uploading },
    actions: { stage, remove, clear, uploadAll },
    query: {},
  };
}
