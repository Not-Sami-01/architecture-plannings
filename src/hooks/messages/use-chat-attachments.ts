"use client";

import { useState } from "react";

import { stageChatFiles, type StagedFile, type StagedRejection } from "@/lib/staged-files";
import { uploadToStorage, type UploadedFile } from "@/lib/api-client/upload";

/**
 * Client-side chat attachment staging (plan Phase B4). Files are validated
 * against the chat limits before any request starts (RULES.md §10) and
 * uploaded with progress when the message is sent.
 */
export function useChatAttachments(orderId: string, isAdmin: boolean) {
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [rejected, setRejected] = useState<StagedRejection[]>([]);
  const [uploading, setUploading] = useState(false);

  const add = (incoming: readonly File[]) => {
    const result = stageChatFiles(staged, incoming, { isAdmin });
    setStaged(result.staged);
    setRejected(result.rejected);
    return result;
  };

  const remove = (key: string) => {
    setStaged((current) => current.filter((file) => file.key !== key));
  };

  const clear = () => {
    setStaged([]);
    setRejected([]);
  };

  /** Uploads every staged file; returns the confirmed file ids in order. */
  const uploadAll = async (): Promise<string[]> => {
    if (staged.length === 0) return [];
    setUploading(true);
    try {
      const uploaded: UploadedFile[] = [];
      for (const stagedFile of staged) {
        uploaded.push(
          await uploadToStorage({
            file: stagedFile.file,
            kind: "CHAT_ATTACHMENT",
            orderId,
            isAdmin,
          }),
        );
      }
      return uploaded.map((file) => file.id);
    } finally {
      setUploading(false);
    }
  };

  return {
    data: staged,
    loadings: {
      uploading,
    },
    actions: {
      add,
      remove,
      clear,
      uploadAll,
    },
    query: { rejected },
  };
}
