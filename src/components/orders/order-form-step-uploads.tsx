"use client";

import { useRef, useState } from "react";
import { useFormState } from "react-hook-form";

import { CircleAlertIcon, FileTextIcon, PlusIcon, Trash2Icon, UploadIcon } from "lucide-react";

import { CLIENT_MIME_TYPES, FILE_LIMITS } from "@/config/constants";
import { formatBytes } from "@/lib/format";
import type { StagedFile, StagedRejection } from "@/lib/staged-files";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import type { OrderFormInstance } from "@/components/orders/order-form";

type OrderFormStepUploadsProps = {
  form: OrderFormInstance;
  /** Files picked so far — staged locally, uploaded on submit. */
  staged: StagedFile[];
  onStage: (files: FileList) => StagedRejection[];
  onRemove: (key: string) => void;
};

const ACCEPT = CLIENT_MIME_TYPES.join(",");

export function OrderFormStepUploads({
  form,
  staged,
  onStage,
  onRemove,
}: OrderFormStepUploadsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rejections, setRejections] = useState<StagedRejection[]>([]);
  const { errors } = useFormState({ control: form.control });
  const error = errors.fileIds?.message;

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    setRejections(onStage(files));
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <FieldGroup className="gap-4">
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel>
          Reference files
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {staged.length} of {FILE_LIMITS.maxClientFiles} · JPG, PNG or PDF · max{" "}
            {formatBytes(FILE_LIMITS.clientMaxSizeBytes)} each
          </span>
        </FieldLabel>

        <div
          role="button"
          tabIndex={0}
          aria-label="Add reference files"
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
            handleFiles(event.dataTransfer.files);
          }}
          className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center text-sm transition-colors ${
            dragging ? "border-primary bg-primary/5" : "text-muted-foreground hover:border-primary"
          }`}
        >
          <UploadIcon className="size-6" aria-hidden />
          <span className="font-medium text-foreground">Drop files here or click to browse</span>
          <span className="text-xs">
            Plot photos, scanned sketches or PDFs — up to {FILE_LIMITS.maxClientFiles} files.
            They upload when you submit your order.
          </span>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          onChange={(event) => handleFiles(event.target.files)}
        />
        <FieldError>{error}</FieldError>
      </Field>

      {rejections.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {rejections.map((rejection) => (
            <li
              key={rejection.name}
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
            >
              <CircleAlertIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>
                <span className="font-medium">{rejection.name}</span> — {rejection.reason}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {staged.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {staged.map((file) => (
            <li
              key={file.key}
              className="flex items-center gap-3 rounded-lg border bg-card p-3 text-sm"
            >
              <FileTextIcon className="size-4 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${file.name}`}
                onClick={() => onRemove(file.key)}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Files are optional — add reference material so the designer can match your plot and
          style.
        </p>
      )}

      {staged.length > 0 ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => inputRef.current?.click()}
        >
          <PlusIcon data-icon="inline-start" />
          Add more files
        </Button>
      ) : null}
    </FieldGroup>
  );
}
