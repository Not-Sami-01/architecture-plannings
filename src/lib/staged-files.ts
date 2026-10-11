import { ADMIN_EXTRA_MIME_TYPES, CLIENT_MIME_TYPES, FILE_LIMITS } from "@/config/constants";
import { formatBytes } from "@/lib/format";

/**
 * A file the user picked in the order form but that has not reached storage
 * yet. Files are staged during the wizard and uploaded as one batch when the
 * order is submitted (submission is gated on every upload succeeding).
 */
export type StagedFile = {
  key: string;
  file: File;
  name: string;
  size: number;
  mime: string;
};

export type StagedRejection = {
  name: string;
  reason: string;
};

export type StageFilesResult = {
  staged: StagedFile[];
  rejected: StagedRejection[];
};

/**
 * Validates incoming files against the shared limits and appends the
 * survivors, keeping their order. Pure so it can be unit-tested.
 */
export function stageFiles(existing: StagedFile[], incoming: readonly File[]): StageFilesResult {
  const staged = [...existing];
  const rejected: StagedRejection[] = [];

  for (const file of incoming) {
    if (staged.length >= FILE_LIMITS.maxClientFiles) {
      rejected.push({
        name: file.name,
        reason: `Limit reached — up to ${FILE_LIMITS.maxClientFiles} files per order.`,
      });
      continue;
    }
    const rejection = rejectCommonFile(file, CLIENT_MIME_TYPES as readonly string[],
      FILE_LIMITS.clientMaxSizeBytes);
    if (rejection) {
      rejected.push(rejection);
      continue;
    }
    staged.push({
      key: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      mime: file.type,
    });
  }

  return { staged, rejected };
}

function rejectCommonFile(
  file: File,
  allowedMimes: readonly string[],
  maxBytes: number,
): StagedRejection | null {
  if (!(allowedMimes as readonly string[]).includes(file.type)) {
    return { name: file.name, reason: "Unsupported type — use JPG, PNG or PDF." };
  }
  if (file.size === 0) {
    return { name: file.name, reason: "File is empty." };
  }
  if (file.size > maxBytes) {
    return {
      name: file.name,
      reason: `Too large — max ${formatBytes(maxBytes)}.`,
    };
  }
  return null;
}

/**
 * Chat attachment staging (plan Phase B4): validates one incoming batch
 * against chat limits. Admins may exceed the client size cap and send the
 * admin mime types; limits always come from FILE_LIMITS — no literals.
 */
export function stageChatFiles(
  existing: readonly StagedFile[],
  incoming: readonly File[],
  opts: { isAdmin: boolean },
): StageFilesResult {
  const staged = [...existing];
  const rejected: StagedRejection[] = [];
  const maxSize = opts.isAdmin
    ? FILE_LIMITS.adminMaxSizeBytes
    : FILE_LIMITS.clientMaxSizeBytes;
  const mimes: readonly string[] = opts.isAdmin
    ? [...CLIENT_MIME_TYPES, ...ADMIN_EXTRA_MIME_TYPES]
    : (CLIENT_MIME_TYPES as readonly string[]);

  for (const file of incoming) {
    if (staged.length >= FILE_LIMITS.maxChatAttachments) {
      rejected.push({
        name: file.name,
        reason: `Limit reached — up to ${FILE_LIMITS.maxChatAttachments} files per message.`,
      });
      continue;
    }
    const rejection = rejectCommonFile(file, mimes, maxSize);
    if (rejection) {
      rejected.push(rejection);
      continue;
    }
    staged.push({
      key: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      mime: file.type,
    });
  }

  return { staged, rejected };
}
