"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { DEFAULT_ERROR_MESSAGE } from "@/config/constants";
import { ApiClientError } from "@/lib/api-client/api";
import { uploadToStorage } from "@/lib/api-client/upload";
import type { StagedFile } from "@/lib/staged-files";

import { filesKeys } from "./upload-keys";

export type BatchUploadItem = {
  key: string;
  name: string;
  size: number;
  status: "waiting" | "uploading" | "done" | "error";
  percent: number;
  error?: string;
  fileId?: string;
};

/** Thrown when at least one file failed — callers must not submit the order. */
export class UploadBatchError extends Error {
  readonly failedKeys: string[];

  constructor(failedKeys: string[]) {
    super("Some files could not be uploaded.");
    this.name = "UploadBatchError";
    this.failedKeys = failedKeys;
  }
}

function waitingItem(file: StagedFile): BatchUploadItem {
  return { key: file.key, name: file.name, size: file.size, status: "waiting", percent: 0 };
}

/**
 * RULES.md §10: one orchestrating hook for a batch of presigned uploads with
 * live per-file progress. Retrying with the same files reuses rows that
 * already finished, so only failed files are sent again. If any file fails,
 * the mutation rejects with `UploadBatchError` — callers gate submission on it.
 */
export function useUploadBatch() {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<BatchUploadItem[]>([]);
  const itemsRef = useRef<BatchUploadItem[]>([]);

  const commit = (next: BatchUploadItem[]) => {
    itemsRef.current = next;
    setItems(next);
  };

  const patchItem = (key: string, patch: Partial<BatchUploadItem>) => {
    commit(itemsRef.current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const mutation = useMutation<string[], Error, StagedFile[]>({
    mutationFn: async (files) => {
      // Same set as the last run (retry) → carry over finished rows; a new
      // set of files starts from scratch.
      const sameSet =
        itemsRef.current.length === files.length &&
        itemsRef.current.length > 0 &&
        files.every((file) => itemsRef.current.some((item) => item.key === file.key));
      const carried = sameSet
        ? itemsRef.current.filter((item) => item.status === "done" && item.fileId)
        : [];
      commit(files.map((file) => carried.find((item) => item.key === file.key) ?? waitingItem(file)));

      const fileIds: string[] = [];
      const failedKeys: string[] = [];

      for (const file of files) {
        const current = itemsRef.current.find((item) => item.key === file.key);
        if (current?.status === "done" && current.fileId) {
          fileIds.push(current.fileId);
          continue;
        }

        patchItem(file.key, { status: "uploading", percent: 0, error: undefined });
        try {
          const uploaded = await uploadToStorage({
            file: file.file,
            kind: "CLIENT",
            onProgress: (percent) => patchItem(file.key, { percent }),
          });
          patchItem(file.key, { status: "done", percent: 100, fileId: uploaded.id });
          fileIds.push(uploaded.id);
        } catch (error) {
          const message = error instanceof ApiClientError ? error.message : DEFAULT_ERROR_MESSAGE;
          patchItem(file.key, { status: "error", percent: 0, error: message });
          failedKeys.push(file.key);
        }
      }

      if (failedKeys.length > 0) {
        throw new UploadBatchError(failedKeys);
      }
      return fileIds;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: filesKeys.mine() });
    },
    onError: (error) => {
      toast.error(
        error instanceof UploadBatchError
          ? "Some files couldn’t be uploaded. Retry them or go back and remove the file."
          : error instanceof ApiClientError
            ? error.message
            : DEFAULT_ERROR_MESSAGE
      );
    },
  });

  return {
    data: { items },
    loadings: {
      uploading: mutation.isPending,
    },
    actions: {
      upload: mutation.mutateAsync,
      reset: () => {
        commit([]);
        mutation.reset();
      },
    },
    query: mutation,
  };
}
