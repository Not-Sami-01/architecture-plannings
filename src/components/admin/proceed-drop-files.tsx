"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CircleAlertIcon, UploadIcon } from "lucide-react";

import { FILE_KINDS, FILE_LIMITS } from "@/config/constants";
import type { FileKind } from "@/config/constants";
import { formatBytes } from "@/lib/format";
import { useAdminOrderUpload } from "@/hooks/orders/use-admin-order-upload";
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

/** Drop-files step of the Proceed dialog: drag & drop with live per-file % (plan 2 P5). */
export function ProceedDropFiles({ orderId, onUploaded }: ProceedDropFilesProps) {
  const upload = useAdminOrderUpload(orderId);
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<FileKind>(FILE_KINDS.DRAFT_PREVIEW as FileKind);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    try {
      const uploaded = await upload.actions.uploadFiles(Array.from(files), kind);
      await queryClient.invalidateQueries({ queryKey: adminOrderKeys.detail(orderId) });
      onUploaded?.(uploaded.length);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed. Please try again.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
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
        aria-label="Drop files to upload"
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
          void handleFiles(event.dataTransfer.files);
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
        aria-label="Choose files to upload"
        disabled={upload.loadings.uploading}
        onChange={(event) => {
          void handleFiles(event.target.files);
        }}
      />

      {upload.loadings.uploading ? (
        <ul className="flex flex-col gap-1.5 text-xs" aria-live="polite">
          {Object.entries(upload.data).map(([name, percent]) => (
            <li key={name} className="flex items-center gap-2">
              <span className="max-w-40 truncate">{name}</span>
              <span className="tabular-nums text-muted-foreground">{percent}%</span>
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: `${percent}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
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
