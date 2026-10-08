import { CLIENT_MIME_TYPES, FILE_LIMITS } from "@/config/constants";
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
    if (!(CLIENT_MIME_TYPES as readonly string[]).includes(file.type)) {
      rejected.push({ name: file.name, reason: "Unsupported type — use JPG, PNG or PDF." });
      continue;
    }
    if (file.size === 0) {
      rejected.push({ name: file.name, reason: "File is empty." });
      continue;
    }
    if (file.size > FILE_LIMITS.clientMaxSizeBytes) {
      rejected.push({
        name: file.name,
        reason: `Too large — max ${formatBytes(FILE_LIMITS.clientMaxSizeBytes)}.`,
      });
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
