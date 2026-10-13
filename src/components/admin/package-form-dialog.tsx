"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormState, useWatch } from "react-hook-form";

import { PACKAGE_IMAGE } from "@/config/constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImageCropDialog } from "@/components/common/image-crop-dialog";
import { useCreatePackage } from "@/hooks/packages/use-create-package";
import { useUpdatePackage } from "@/hooks/packages/use-update-package";
import { useUploadPackageImage } from "@/hooks/packages/use-upload-package-image";
import type { AdminPackage } from "@/hooks/packages/use-admin-packages";
import { ApiClientError } from "@/lib/api-client/api";
import {
  packageFormSchema,
  packageImageFileSchema,
  splitDeliverables,
  type CreatePackageInput,
  type PackageFormValues,
} from "@/lib/validators/admin-packages";

type PackageFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Package being edited, or null to create a new one. */
  pkg: AdminPackage | null;
};

function toValues(pkg: AdminPackage | null): PackageFormValues {
  return {
    name: pkg?.name ?? "",
    slug: pkg?.slug ?? "",
    description: pkg?.description ?? "",
    price: pkg?.price ?? 0,
    revisionLimit: pkg?.revisionLimit ?? 2,
    deliverables: pkg?.deliverables.join("\n") ?? "",
    sortOrder: pkg?.sortOrder ?? 0,
    active: pkg?.active ?? true,
  };
}

export function PackageFormDialog({ open, onOpenChange, pkg }: PackageFormDialogProps) {
  const { actions: createActions, loadings: createLoadings } = useCreatePackage();
  const { actions: updateActions, loadings: updateLoadings } = useUpdatePackage();
  const { actions: imageActions, loadings: imageLoadings } = useUploadPackageImage();

  // Card image: pick → crop (fixed 4:3) → upload. Object URL for the crop preview.
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: toValues(pkg),
  });
  // Compiler memoizes form.formState reads; useFormState subscribes (facebook/react#29144).
  const { errors } = useFormState({ control: form.control });
  const active = useWatch({ control: form.control, name: "active" });
  const submitting = createLoadings.creating || updateLoadings.updating;

  useEffect(() => {
    if (open) {
      form.reset(toValues(pkg));
    }
  }, [open, pkg, form]);

  /** All close paths (footer button, ESC, overlay) release the object URL. */
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
      setImageError(null);
    }
    onOpenChange(isOpen);
  };

  const onPickImage = (file: File | null) => {
    // Reset so picking the same file twice still fires onChange.
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (!file || !pkg) return;
    const parsed = packageImageFileSchema.safeParse({
      filename: file.name,
      mime: file.type,
      size: file.size,
    });
    if (!parsed.success) {
      setImageError(parsed.error.issues[0]?.message ?? PACKAGE_IMAGE.recommended);
      return;
    }
    setImageError(null);
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const onCropped = async (blob: Blob) => {
    if (!pkg) return;
    await imageActions.upload({ packageId: pkg.id, file: blob });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const input: CreatePackageInput = {
      name: values.name,
      slug: values.slug || undefined,
      description: values.description,
      price: values.price,
      revisionLimit: values.revisionLimit,
      deliverables: splitDeliverables(values.deliverables),
      sortOrder: values.sortOrder,
    };

    try {
      if (pkg) {
        await updateActions.update({ id: pkg.id, input: { ...input, active: values.active } });
      } else {
        await createActions.create(input);
      }
      onOpenChange(false);
    } catch (error) {
      // Toasts live in the hooks; map field-level API errors onto the form.
      if (error instanceof ApiClientError && Array.isArray(error.details)) {
        for (const issue of error.details as Array<{ path: (string | number)[]; message: string }>) {
          const field = issue.path.join(".");
          if (field in form.getValues()) {
            form.setError(field as keyof PackageFormValues, { message: issue.message });
          }
        }
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{pkg ? `Edit ${pkg.name}` : "New package"}</DialogTitle>
          <DialogDescription>
            {pkg
              ? "Update the pricing shown on the services and order pages."
              : "Add a package. It appears on the site once created."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={errors.name ? true : undefined}>
                <FieldLabel htmlFor="pkg-name">Name</FieldLabel>
                <Input
                  id="pkg-name"
                  placeholder="Plan + Elevation"
                  {...form.register("name")}
                />
                <FieldError>{errors.name?.message}</FieldError>
              </Field>

              <Field data-invalid={errors.slug ? true : undefined}>
                <FieldLabel htmlFor="pkg-slug">Slug</FieldLabel>
                <Input
                  id="pkg-slug"
                  placeholder="plan-elevation (auto if empty)"
                  {...form.register("slug")}
                />
                <FieldError>{errors.slug?.message}</FieldError>
              </Field>

              <Field data-invalid={errors.price ? true : undefined}>
                <FieldLabel htmlFor="pkg-price">Price</FieldLabel>
                <Input
                  id="pkg-price"
                  type="number"
                  min={1}
                  step={1}
                  {...form.register("price", { valueAsNumber: true })}
                />
                <FieldError>{errors.price?.message}</FieldError>
              </Field>

              <Field data-invalid={errors.revisionLimit ? true : undefined}>
                <FieldLabel htmlFor="pkg-revisions">Revision limit</FieldLabel>
                <Input
                  id="pkg-revisions"
                  type="number"
                  min={0}
                  max={20}
                  step={1}
                  {...form.register("revisionLimit", { valueAsNumber: true })}
                />
                <FieldError>{errors.revisionLimit?.message}</FieldError>
              </Field>

              <Field data-invalid={errors.sortOrder ? true : undefined}>
                <FieldLabel htmlFor="pkg-sort">Sort order</FieldLabel>
                <Input
                  id="pkg-sort"
                  type="number"
                  min={0}
                  step={1}
                  {...form.register("sortOrder", { valueAsNumber: true })}
                />
                <FieldError>{errors.sortOrder?.message}</FieldError>
              </Field>

              <Field data-invalid={errors.deliverables ? true : undefined}>
                <FieldLabel htmlFor="pkg-deliverables">Deliverables</FieldLabel>
                <Textarea
                  id="pkg-deliverables"
                  rows={4}
                  placeholder={"Floor plan\nFront elevation"}
                  {...form.register("deliverables")}
                />
                <FieldError>{errors.deliverables?.message}</FieldError>
              </Field>
            </div>

            <Field data-invalid={errors.description ? true : undefined}>
              <FieldLabel htmlFor="pkg-description">Description</FieldLabel>
              <Textarea
                id="pkg-description"
                rows={3}
                placeholder="What this package includes, in one or two sentences."
                {...form.register("description")}
              />
              <FieldError>{errors.description?.message}</FieldError>
            </Field>

            {pkg ? (
              <Field data-invalid={errors.active ? true : undefined}>
                <label
                  htmlFor="pkg-active"
                  className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5"
                >
                  <span className="text-sm font-medium">
                    Active
                    <span className="block text-xs font-normal text-muted-foreground">
                      Inactive packages stay hidden from the site.
                    </span>
                  </span>
                  <Switch
                    id="pkg-active"
                    checked={active ?? true}
                    onCheckedChange={(checked) =>
                      form.setValue("active", checked === true, { shouldValidate: true })
                    }
                  />
                </label>
                <FieldError>{errors.active?.message}</FieldError>
              </Field>
            ) : null}

            {pkg ? (
              <div className="rounded-lg border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{PACKAGE_IMAGE.label}</p>
                    <p className="text-xs text-muted-foreground">{PACKAGE_IMAGE.recommended}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={imageLoadings.uploading}
                      onClick={() => imageInputRef.current?.click()}
                    >
                      {imageLoadings.uploading
                        ? "Uploading…"
                        : pkg.imageKey
                          ? "Replace"
                          : "Add image"}
                    </Button>
                    {pkg.imageKey ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={imageLoadings.clearing}
                        onClick={() => imageActions.clear(pkg.id)}
                      >
                        {imageLoadings.clearing ? "Removing…" : "Remove"}
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3">
                  {pkg.imageKey ? (
                    <Image
                      src={`/api/packages/${pkg.id}/image`}
                      alt=""
                      aria-hidden
                      width={160}
                      height={120}
                      unoptimized
                      className="aspect-[4/3] w-40 rounded-lg border object-cover"
                    />
                  ) : (
                    <div
                      className="grid aspect-[4/3] w-40 place-items-center rounded-lg border border-dashed bg-muted px-2 text-center text-xs text-muted-foreground"
                      aria-hidden
                    >
                      No image yet
                    </div>
                  )}
                </div>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept={PACKAGE_IMAGE.mimeTypes.join(",")}
                  className="sr-only"
                  onChange={(event) => onPickImage(event.target.files?.[0] ?? null)}
                />
                {imageError ? <p className="mt-2 text-xs text-destructive">{imageError}</p> : null}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Save the package first, then add a card image.
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : pkg ? "Save changes" : "Create package"}
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>

        <ImageCropDialog
          open={cropSrc !== null}
          onOpenChange={(isOpen) => {
            if (!isOpen && cropSrc) {
              URL.revokeObjectURL(cropSrc);
              setCropSrc(null);
            }
          }}
          src={cropSrc ?? ""}
          onCropped={onCropped}
          title={`Crop ${PACKAGE_IMAGE.label.toLowerCase()}`}
        />
      </DialogContent>
    </Dialog>
  );
}
