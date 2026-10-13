"use client";

import { XIcon } from "lucide-react";

import { formatBytes } from "@/lib/format";
import type { StagedFile, StagedRejection } from "@/lib/staged-files";
import { Button } from "@/components/ui/button";

type StagedFileListProps = {
  staged: readonly StagedFile[];
  rejected?: readonly StagedRejection[];
  /** Live per-file percent while the batch is uploading (name → percent). */
  progress?: Record<string, number>;
  onRemove: (key: string) => void;
  disabled?: boolean;
};

/**
 * The staged queue shared by admin upload surfaces (plan 5 C): file name,
 * size, remove button (≥44px target) and progress % once uploading starts.
 */
export function StagedFileList({
  staged,
  rejected = [],
  progress = {},
  onRemove,
  disabled = false,
}: StagedFileListProps) {
  if (!staged.length && !rejected.length) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <ul className="flex flex-col gap-1 text-xs" aria-live="polite">
        {staged.map((file) => {
          const percent = progress[file.name];
          return (
            <li
              key={file.key}
              className="flex items-center gap-2 rounded-lg border bg-muted/40 px-2 py-1.5"
            >
              <span className="min-w-0 flex-1 truncate" title={file.name}>
                {file.name}
              </span>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {formatBytes(file.size)}
              </span>
              {percent !== undefined ? (
                <span className="shrink-0 tabular-nums">{percent}%</span>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                aria-label={`Remove ${file.name} from the upload queue`}
                disabled={disabled}
                onClick={() => onRemove(file.key)}
              >
                <XIcon className="size-3.5" aria-hidden />
              </Button>
            </li>
          );
        })}
      </ul>
      {rejected.length ? (
        <ul className="flex flex-col gap-1 text-xs text-destructive">
          {rejected.map((entry) => (
            <li key={`${entry.name}-${entry.reason}`}>
              <span className="font-medium">{entry.name}</span>: {entry.reason}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
