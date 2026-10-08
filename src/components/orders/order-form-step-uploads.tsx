"use client";

import { useRef } from "react";
import { useFormState, useWatch } from "react-hook-form";

import { FileIcon, Trash2Icon } from "lucide-react";

import { FILE_LIMITS } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { useUploadFile } from "@/hooks/files/use-upload-file";
import type { OrderFormInstance } from "@/components/orders/order-form";

type OrderFormStepUploadsProps = {
  form: OrderFormInstance;
};

type TrackedUpload = {
  id: string;
  filename: string;
  size: number;
  mime: string;
};

export function OrderFormStepUploads({ form }: OrderFormStepUploadsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { actions, loadings } = useUploadFile();
  // Hook equivalents stay reactive under React Compiler (facebook/react#29144).
  const fileIds = useWatch({ control: form.control, name: "fileIds" }) ?? [];
  const { errors } = useFormState({ control: form.control });
  const error = errors.fileIds?.message;

  const uploaded: TrackedUpload[] = []; // tracked by fileIds; names shown from ids after refresh

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;

    for (const file of Array.from(files)) {
      if (fileIds.length >= FILE_LIMITS.maxClientFiles) break;
      if (loadings.uploading) break;
      try {
        const uploadedFile = await actions.upload({ file, kind: "CLIENT" });
        const next = [...form.getValues("fileIds"), uploadedFile.id];
        form.setValue("fileIds", next, { shouldValidate: true });
      } catch {
        // Toasted by the hook.
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (id: string) => {
    form.setValue(
      "fileIds",
      fileIds.filter((existing) => existing !== id),
      { shouldValidate: true }
    );
  };

  return (
    <FieldGroup className="gap-4">
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel>Reference files (up to {FILE_LIMITS.maxClientFiles}, JPG/PNG/PDF, max 10 MB each)</FieldLabel>
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
          }}
          className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground hover:border-primary"
        >
          <FileIcon className="size-6" aria-hidden />
          Click to choose files
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={["image/jpeg", "image/png", "application/pdf"].join(",")}
          className="sr-only"
          onChange={(event) => void handleFiles(event.target.files)}
        />
        <FieldError>{error}</FieldError>
      </Field>

      {uploaded.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {uploaded.map((file) => (
            <li key={file.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <span className="truncate">{file.filename}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${file.filename}`}
                onClick={() => removeFile(file.id)}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : fileIds.length === 0 ? (
        <p className="text-sm text-muted-foreground">Files are optional — you can submit without any.</p>
      ) : (
        <Progress value={100} />
      )}
    </FieldGroup>
  );
}
