import axios from "axios";

import {
  ADMIN_EXTRA_MIME_TYPES,
  API_ROUTES,
  CLIENT_MIME_TYPES,
  FILE_LIMITS,
  type FileKind,
} from "@/config/constants";
import { api, ApiClientError } from "@/lib/api-client/api";
import { formatBytes } from "@/lib/format";

/**
 * Presign → direct-to-storage PUT → confirm (RULES.md §10). This is the one
 * sanctioned axios sibling of the `api` util: the PUT target is a
 * provider-signed URL, not an app endpoint, so it cannot go through `api`.
 */

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

export type UploadToStorageInput = {
  file: File;
  kind: FileKind;
  /** Attach the file to an existing order at presign time (chat, admin uploads). */
  orderId?: string;
  /** Admin uploads may exceed the client cap and use extra mime types. */
  isAdmin?: boolean;
  /** 0–100 during the direct upload. */
  onProgress?: (percent: number) => void;
};

export async function uploadToStorage({
  file,
  kind,
  orderId,
  isAdmin = false,
  onProgress,
}: UploadToStorageInput): Promise<UploadedFile> {
  // Client-side pre-checks from constants; the server re-checks both anyway.
  const allowedMimes: readonly string[] = isAdmin
    ? [...CLIENT_MIME_TYPES, ...ADMIN_EXTRA_MIME_TYPES]
    : (CLIENT_MIME_TYPES as readonly string[]);
  const maxBytes = isAdmin ? FILE_LIMITS.adminMaxSizeBytes : FILE_LIMITS.clientMaxSizeBytes;

  if (!(allowedMimes as readonly string[]).includes(file.type)) {
    throw new ApiClientError(415, "This file type is not allowed.", "UNSUPPORTED_FILE_TYPE");
  }
  if (file.size > maxBytes) {
    throw new ApiClientError(
      413,
      `The file is too large (max ${formatBytes(maxBytes)}).`,
      "FILE_TOO_LARGE",
    );
  }

  const presign = await api<PresignResponse>("post", {
    url: API_ROUTES.filesPresign,
    body: { filename: file.name, mime: file.type, size: file.size, kind, ...(orderId ? { orderId } : {}) },
  });

  await axios.put(presign.data.url, file, {
    headers: { "Content-Type": file.type },
    withCredentials: presign.data.method === "LOCAL",
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    },
  });

  const confirmed = await api<UploadedFile>("post", {
    url: API_ROUTES.filesConfirm,
    body: { fileId: presign.data.fileId },
  });
  return confirmed.data as UploadedFile;
}
