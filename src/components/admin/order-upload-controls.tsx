"use client";

import { useRef, useState } from "react";

import { FILE_KINDS, FILE_LIMITS } from "@/config/constants";
import type { FileKind } from "@/config/constants";
import { useStagedAdminUpload } from "@/hooks/orders/use-staged-admin-upload";
import { useQueryClient } from "@tanstack/react-query";
import { adminOrderKeys } from "@/hooks/orders/admin-order-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StagedFileList } from "@/components/admin/staged-file-list";

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

/**
 * Admin upload to an order (plan 5 C): files are staged into a queue first —
 * review, remove, then press Upload (N). Nothing is stored until then.
 */
export function OrderUploadControls({ orderId }: OrderUploadControlsProps) {
  const upload = useStagedAdminUpload(orderId);
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<FileKind>(FILE_KINDS.DRAFT_PREVIEW as FileKind);
  const { staged, rejected, progress } = upload.data;
  const uploading = upload.loadings.uploading;

  const handlePicked = (files: FileList | null) => {
    upload.actions.stage(files);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    try {
      const uploaded = await upload.actions.uploadAll(kind);
      if (uploaded.length) {
        await queryClient.invalidateQueries({ queryKey: adminOrderKeys.detail(orderId) });
      }
    } catch {
      // uploadToStorage already toasts failures; the queue is preserved
      // so the admin can retry without re-picking files.
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
        aria-label="Stage files for this order"
        disabled={uploading}
        onChange={(event) => handlePicked(event.target.files)}
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
          size="sm"
          className="w-full"
          disabled={uploading}
          onClick={() => void handleUpload()}
        >
          {uploading ? "Uploading…" : `Upload (${staged.length})`}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">
          Up to {FILE_LIMITS.maxClientFiles} files per batch · drawings, zips and CAD formats
          allowed for admins.
        </p>
      )}
    </div>
  );
}
