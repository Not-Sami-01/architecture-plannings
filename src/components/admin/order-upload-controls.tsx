"use client";

import { useRef, useState } from "react";

import { FILE_KINDS, FILE_LIMITS } from "@/config/constants";
import type { FileKind } from "@/config/constants";
import { useAdminOrderUpload } from "@/hooks/orders/use-admin-order-upload";
import { useQueryClient } from "@tanstack/react-query";
import { adminOrderKeys } from "@/hooks/orders/admin-order-keys";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OrderUploadControlsProps = {
  orderId: string;
};

const UPLOAD_KINDS: FileKind[] = [
  FILE_KINDS.DRAFT_PREVIEW,
  FILE_KINDS.DRAFT_ORIGINAL,
  FILE_KINDS.FINAL,
  FILE_KINDS.REVISION_REF,
  FILE_KINDS.PAYMENT_PROOF,
] as FileKind[];

/** Admin upload to an order (plan Phase D4): kind picker, per-file progress. */
export function OrderUploadControls({ orderId }: OrderUploadControlsProps) {
  const upload = useAdminOrderUpload(orderId);
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<FileKind>(FILE_KINDS.DRAFT_PREVIEW as FileKind);

  const handleFiles = async (files: FileList) => {
    try {
      await upload.actions.uploadFiles(Array.from(files), kind);
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.detail(orderId) });
    } catch {
      // Upload errors already surfaced via toasts in uploadToStorage callers.
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="upload-kind" className="text-xs">
          File kind
        </Label>
        <Select value={kind} onValueChange={(value) => setKind(value as FileKind)}>
          <SelectTrigger id="upload-kind" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UPLOAD_KINDS.map((option) => (
              <SelectItem key={option} value={option}>
                {option.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Input
        ref={inputRef}
        type="file"
        multiple
        className="text-xs"
        aria-label="Upload files to this order"
        disabled={upload.loadings.uploading}
        onChange={(event) => {
          if (event.target.files?.length) {
            void handleFiles(event.target.files);
          }
        }}
      />
      {upload.loadings.uploading ? (
        <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
          {Object.entries(upload.data).map(([name, percent]) => (
            <li key={name} className="flex items-center gap-2">
              <span className="max-w-32 truncate">{name}</span>
              <span className="tabular-nums">{percent}%</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">
          Up to {FILE_LIMITS.maxClientFiles} files per batch · drawings, zips and CAD formats
          allowed for admins.
        </p>
      )}
    </div>
  );
}
