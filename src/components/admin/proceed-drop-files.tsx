"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CircleAlertIcon, UploadIcon } from "lucide-react";

import { FILE_KINDS, FILE_LIMITS } from "@/config/constants";
import type { FileKind } from "@/config/constants";
import { formatBytes } from "@/lib/format";
import { useStagedAdminUpload } from "@/hooks/orders/use-staged-admin-upload";
import { adminOrderKeys } from "@/hooks/orders/admin-order-keys";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StagedFileList } from "@/components/admin/staged-file-list";

type ProceedDropFilesProps = {
  orderId: string;
  /** Called after every file in the batch is stored. */
  onUploaded?: (count: number) => void;
};

const DROP_KINDS: { kind: FileKind; label: string }[] = [
  { kind: FILE_KINDS.DRAFT_PREVIEW, label: "Draft preview" },
  { kind: FILE_KINDS.DRAFT_ORIGINAL, label: "Draft original" },
  { kind: FILE_KINDS.FINAL, label: "Final drawings" },
  { kind: FILE_KINDS.REVISION_REF, label: "Revision reference" },
  { kind: FILE_KINDS.PAYMENT_PROOF, label: "Payment proof" },
];

/**
 * Drop-files step of the Proceed dialog (plan 5 C): drop stages the batch
 * into a queue — review and remove, then press Upload (N) to store it.
 */
export function ProceedDropFiles({ orderId, onUploaded }: ProceedDropFilesProps) {
  const upload = useStagedAdminUpload(orderId);
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<FileKind>(FILE_KINDS.DRAFT_PREVIEW as FileKind);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { staged, rejected, progress } = upload.data;
  const uploading = upload.loadings.uploading;

  const stageDropped = (files: FileList | null) => {
    setError(null);
    upload.actions.stage(files);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    setError(null);
    try {
      const uploaded = await upload.actions.uploadAll(kind);
      if (!uploaded.length) return;
      await queryClient.invalidateQueries({ queryKey: adminOrderKeys.detail(orderId) });
      onUploaded?.(uploaded.length);
    } catch (cause) {
      // Queue is preserved for a retry; only unexpected failures land here.
      setError(cause instanceof Error ? cause.message : "Upload failed. Please try again.");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="proceed-drop-kind" className="text-xs">
          What are you delivering?
        </Label>
        <Select value={kind} onValueChange={(value) => setKind(value as FileKind)}>
          <SelectTrigger id="proceed-drop-kind" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DROP_KINDS.map((option) => (
              <SelectItem key={option.kind} value={option.kind}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Stage files to upload"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          stageDropped(event.dataTransfer.files);
        }}
        className={`flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center text-sm transition-colors ${
          dragging ? "border-primary bg-primary/5" : "text-muted-foreground hover:border-primary"
        }`}
      >
        <UploadIcon className="size-6" aria-hidden />
        <span className="font-medium text-foreground">Drop files here or click to browse</span>
        <span className="text-xs">
          Up to {FILE_LIMITS.maxClientFiles} files · up to{" "}
          {formatBytes(FILE_LIMITS.adminMaxSizeBytes)} each for admins.
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        aria-label="Choose files to stage"
        disabled={uploading}
        onChange={(event) => stageDropped(event.target.files)}
      />

      <StagedFileList
        staged={staged}
        rejected={rejected}
        progress={uploading ? progress : undefined}
        onRemove={upload.actions.remove}
        disabled={uploading}
      />

      {staged.length ? (
        <Button
          type="button"
          className="w-full"
          disabled={uploading}
          onClick={() => void handleUpload()}
        >
          {uploading ? "Uploading…" : `Upload (${staged.length})`}
        </Button>
      ) : null}

      {error ? (
        <p className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <CircleAlertIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}
    </div>
  );
}
