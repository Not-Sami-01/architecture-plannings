"use client";

import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormState } from "react-hook-form";
import { z } from "zod";
import { ImageIcon, XIcon } from "lucide-react";

import { CLIENT_MIME_TYPES, FILE_LIMITS, REVISIONS } from "@/config/constants";
import { formatBytes } from "@/lib/format";
import { uploadToStorage } from "@/lib/api-client/upload";
import { useRequestRevision } from "@/hooks/orders/use-request-revision";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

/** Reference images only — screenshots and photos of what should change. */
const REF_IMAGE_MIMES = CLIENT_MIME_TYPES.filter((mime) => mime.startsWith("image/"));

const formSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Describe what should change.")
    .max(REVISIONS.maxLength, `Keep the request under ${REVISIONS.maxLength} characters.`),
});

type FormValues = z.infer<typeof formSchema>;

type OrderRevisionFormProps = {
  orderId: string;
  /** Called after a successful request so the dialog can close. */
  onDone?: () => void;
};

/** RHF + zod revision request with up to 5 reference images (plan 3 P5). */
export function OrderRevisionForm({ orderId, onDone }: OrderRevisionFormProps) {
  const { actions, loadings } = useRequestRevision();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: "" },
  });
  const { errors } = useFormState({ control: form.control });

  const addImages = (incoming: FileList | null) => {
    setFileError(null);
    if (!incoming?.length) return;
    const next = [...images];
    for (const file of Array.from(incoming)) {
      if (next.length >= REVISIONS.maxRefFiles) {
        setFileError(`At most ${REVISIONS.maxRefFiles} reference images.`);
        break;
      }
      if (!REF_IMAGE_MIMES.includes(file.type as (typeof REF_IMAGE_MIMES)[number])) {
        setFileError("Reference images must be JPG or PNG.");
        break;
      }
      if (file.size > FILE_LIMITS.clientMaxSizeBytes) {
        setFileError(`Too large — max ${formatBytes(FILE_LIMITS.clientMaxSizeBytes)}.`);
        break;
      }
      next.push(file);
    }
    setImages(next);
  };

  const removeImage = (key: string) => {
    setImages((prev) => prev.filter((file) => file.name + file.size !== key));
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setUploadError(null);
    try {
      const fileIds: string[] = [];
      for (const image of images) {
        const uploaded = await uploadToStorage({
          file: image,
          kind: "REVISION_REF",
          orderId,
          isAdmin: false,
        });
        fileIds.push(uploaded.id);
      }
      await actions.request({ orderId, message: values.message, fileIds });
      form.reset({ message: "" });
      setImages([]);
      onDone?.();
    } catch {
      // The hook toasts API errors; storage failures land inline so the
      // dialog stays open and the typed message is never lost.
      setUploadError("A file failed to upload. Try again.");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FieldGroup>
        <Field data-invalid={errors.message ? true : undefined}>
          <FieldLabel htmlFor="revision-message">What should we change?</FieldLabel>
          <Textarea
            id="revision-message"
            rows={4}
            placeholder="e.g. Widen the master bedroom and move the kitchen door."
            aria-invalid={errors.message ? true : undefined}
            {...form.register("message")}
          />
          <FieldError>{errors.message?.message}</FieldError>
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">
            Reference images ({images.length}/{REVISIONS.maxRefFiles})
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={images.length >= REVISIONS.maxRefFiles}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="size-4" aria-hidden />
            Add images
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={REF_IMAGE_MIMES.join(",")}
            className="sr-only"
            aria-label="Reference images"
            onChange={(event) => {
              addImages(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
        {fileError ? <p className="text-sm text-destructive">{fileError}</p> : null}
        {uploadError ? <p className="text-sm text-destructive">{uploadError}</p> : null}
        {images.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {images.map((image) => {
              const key = image.name + image.size;
              return (
                <li key={key} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                  <span className="truncate">{image.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatBytes(image.size)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Remove ${image.name}`}
                      onClick={() => removeImage(key)}
                    >
                      <XIcon className="size-4" aria-hidden />
                    </Button>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <Button type="submit" disabled={loadings.requesting}>
        {loadings.requesting ? "Sending…" : "Request revision"}
      </Button>
    </form>
  );
}
