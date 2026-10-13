"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormState } from "react-hook-form";
import { ArrowDownIcon, ArrowUpIcon, ImageIcon, StarIcon, XIcon } from "lucide-react";

import {
  API_ROUTES,
  PORTFOLIO_CATEGORIES,
  PORTFOLIO_IMAGE,
  PORTFOLIO_PLOT_SIZES,
  PORTFOLIO_STYLE_OPTIONS,
} from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageCropDialog } from "@/components/common/image-crop-dialog";
import { useUploadPortfolioImage } from "@/hooks/admin/use-upload-portfolio-image";
import {
  useCreatePortfolioProject,
  useUpdatePortfolioProject,
} from "@/hooks/admin/use-admin-portfolio-mutations";
import type { AdminPortfolioRow } from "@/hooks/admin/use-admin-portfolio-projects";
import { slugifyPortfolio } from "@/lib/portfolio/slug";
import {
  portfolioFormSchema,
  type PortfolioFormValues,
} from "@/lib/validators/admin-portfolio";

type PortfolioFormProps = {
  /** Project being edited, or null to create a new one. */
  project: AdminPortfolioRow | null;
};

function toValues(project: AdminPortfolioRow | null): PortfolioFormValues {
  return {
    title: project?.title ?? "",
    slug: project?.slug ?? "",
    category: (project?.category ?? "Full house") as PortfolioFormValues["category"],
    plotSize: (project?.plotSize ?? "5 marla") as PortfolioFormValues["plotSize"],
    style: (project?.style ?? "MODERN") as PortfolioFormValues["style"],
    description: project?.description ?? "",
    featured: project?.featured ?? false,
    visible: project?.visible ?? true,
    imageIds: project?.images ?? [],
  };
}

export function PortfolioForm({ project }: PortfolioFormProps) {
  const router = useRouter();
  const { actions: createActions, loadings: createLoadings } = useCreatePortfolioProject();
  const { actions: updateActions, loadings: updateLoadings } = useUpdatePortfolioProject();
  const { actions: uploadActions, loadings: uploadLoadings } = useUploadPortfolioImage();

  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PortfolioFormValues>({
    resolver: zodResolver(portfolioFormSchema),
    defaultValues: toValues(project),
  });
  const { errors } = useFormState({ control: form.control });
  const submitting = createLoadings.creating || updateLoadings.updating;
  const imageIds = form.watch("imageIds");

  const handlePickImage = (file: File | null) => {
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (!file) return;
    const ok = PORTFOLIO_IMAGE.mimeTypes.includes(file.type as (typeof PORTFOLIO_IMAGE.mimeTypes)[number]);
    if (!ok || file.size > PORTFOLIO_IMAGE.maxSourceBytes) {
      setImageError(PORTFOLIO_IMAGE.recommended);
      return;
    }
    if (imageIds.length >= PORTFOLIO_IMAGE.maxPerProject) {
      setImageError(`Up to ${PORTFOLIO_IMAGE.maxPerProject} images per project.`);
      return;
    }
    setImageError(null);
    setCropSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const handleCropped = async (blob: Blob) => {
    const { id } = await uploadActions.upload({ file: blob, filename: "project.jpg" });
    form.setValue("imageIds", [...form.getValues("imageIds"), id], { shouldDirty: true });
  };

  const removeImage = (id: string) => {
    form.setValue(
      "imageIds",
      form.getValues("imageIds").filter((fileId) => fileId !== id),
      { shouldDirty: true },
    );
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const current = [...form.getValues("imageIds")];
    const target = index + direction;
    if (target < 0 || target >= current.length) return;
    [current[index], current[target]] = [current[target], current[index]];
    form.setValue("imageIds", current, { shouldDirty: true });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    // Blank slug = derive from title server-side; the slug is locked after create.
    const slug = values.slug?.trim() || undefined;
    if (project) {
      await updateActions.update({ id: project.id, input: { ...values, slug: undefined } });
      router.push("/admin/portfolio");
      router.refresh();
    } else {
      const created = await createActions.create({ ...values, slug });
      router.push(`/admin/portfolio/${created.id}`);
      router.refresh();
    }
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <FieldGroup>
          <Field data-invalid={Boolean(errors.title)}>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input
              id="title"
              placeholder="Modern 5 marla home"
              aria-describedby={errors.title ? "title-error" : undefined}
              {...form.register("title", {
                onBlur: () => {
                  if (!form.getValues("slug") && !project) {
                    const title = form.getValues("title");
                    if (title) form.setValue("slug", slugifyPortfolio(title));
                  }
                },
              })}
            />
            {errors.title ? <FieldError id="title-error">{errors.title.message}</FieldError> : null}
          </Field>

          <Field data-invalid={Boolean(errors.slug)}>
            <FieldLabel htmlFor="slug">Slug</FieldLabel>
            <Input
              id="slug"
              placeholder="auto-derived-from-title"
              disabled={Boolean(project)}
              aria-describedby={errors.slug ? "slug-error" : undefined}
              {...form.register("slug")}
            />
            {project ? (
              <p className="text-xs text-muted-foreground">
                Slugs are locked after create — the public URL never changes.
              </p>
            ) : null}
            {errors.slug ? <FieldError id="slug-error">{errors.slug.message}</FieldError> : null}
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field data-invalid={Boolean(errors.category)}>
              <FieldLabel>Category</FieldLabel>
              <Select
                value={form.watch("category")}
                onValueChange={(value) =>
                  form.setValue("category", value as PortfolioFormValues["category"], {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger className="w-full" aria-label="Category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PORTFOLIO_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category ? <FieldError>{errors.category.message}</FieldError> : null}
            </Field>

            <Field data-invalid={Boolean(errors.plotSize)}>
              <FieldLabel>Plot size</FieldLabel>
              <Select
                value={form.watch("plotSize")}
                onValueChange={(value) =>
                  form.setValue("plotSize", value as PortfolioFormValues["plotSize"], {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger className="w-full" aria-label="Plot size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PORTFOLIO_PLOT_SIZES.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.plotSize ? <FieldError>{errors.plotSize.message}</FieldError> : null}
            </Field>

            <Field data-invalid={Boolean(errors.style)}>
              <FieldLabel>Style</FieldLabel>
              <Select
                value={form.watch("style")}
                onValueChange={(value) =>
                  form.setValue("style", value as PortfolioFormValues["style"], {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger className="w-full" aria-label="Style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PORTFOLIO_STYLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.style ? <FieldError>{errors.style.message}</FieldError> : null}
            </Field>
          </div>

          <Field data-invalid={Boolean(errors.description)}>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              rows={4}
              placeholder="What makes this layout work — the thinking behind the plan."
              aria-describedby={errors.description ? "description-error" : undefined}
              {...form.register("description")}
            />
            {errors.description ? (
              <FieldError id="description-error">{errors.description.message}</FieldError>
            ) : null}
          </Field>
        </FieldGroup>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Gallery</span>
          <p className="text-xs text-muted-foreground">
            {PORTFOLIO_IMAGE.recommended} · first image is the cover · up to{" "}
            {PORTFOLIO_IMAGE.maxPerProject} images.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {imageIds.map((id, index) => (
              <div
                key={id}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted"
              >
                <Image
                  src={API_ROUTES.portfolioImage(id)}
                  alt={`Project image ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover"
                />
                {index === 0 ? (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium">
                    <StarIcon className="size-3" aria-hidden />
                    Cover
                  </span>
                ) : null}
                <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-sm"
                    className="bg-background/90"
                    aria-label="Move image up"
                    disabled={index === 0}
                    onClick={() => moveImage(index, -1)}
                  >
                    <ArrowUpIcon className="size-3.5" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-sm"
                    className="bg-background/90"
                    aria-label="Move image down"
                    disabled={index === imageIds.length - 1}
                    onClick={() => moveImage(index, 1)}
                  >
                    <ArrowDownIcon className="size-3.5" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-sm"
                    className="bg-background/90"
                    aria-label="Remove image"
                    onClick={() => removeImage(id)}
                  >
                    <XIcon className="size-3.5" aria-hidden />
                  </Button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs text-muted-foreground hover:border-primary hover:text-primary"
            >
              <ImageIcon className="size-5" aria-hidden />
              {uploadLoadings.uploading ? "Uploading…" : "Add image"}
            </button>
          </div>
          {imageError ? <FieldError>{imageError}</FieldError> : null}
          <input
            ref={imageInputRef}
            type="file"
            accept={PORTFOLIO_IMAGE.mimeTypes.join(",")}
            className="hidden"
            onChange={(event) => handlePickImage(event.target.files?.[0] ?? null)}
          />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Switch
              checked={form.watch("featured")}
              onCheckedChange={(checked) => form.setValue("featured", checked, { shouldDirty: true })}
            />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <Switch
              checked={form.watch("visible")}
              onCheckedChange={(checked) => form.setValue("visible", checked, { shouldDirty: true })}
            />
            Visible on /portfolio
          </label>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting || uploadLoadings.uploading}>
            {submitting ? "Saving…" : project ? "Save changes" : "Create project"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/portfolio")}
          >
            Cancel
          </Button>
        </div>
      </form>

      <aside className="flex h-fit flex-col gap-4 rounded-xl border p-4 text-sm">
        <h2 className="font-medium">SERP preview</h2>
        <div className="rounded-lg border p-3">
          <p className="truncate text-primary">
            {form.watch("title") || "Project title"} — House Design
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            yoursite.com/portfolio/{form.watch("slug") || "project-slug"}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {form.watch("description") ||
              `${form.watch("plotSize")} ${form.watch("style").toLowerCase()} house design.`}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Hidden projects stay in the admin list but never appear on the public pages, in the
          sitemap, or through the public API.
        </p>
      </aside>

      <ImageCropDialog
        open={cropSrc !== null}
        onOpenChange={(open) => {
          if (!open) {
            if (cropSrc) URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
          }
        }}
        src={cropSrc ?? ""}
        onCropped={handleCropped}
        title="Crop project image"
        config={{
          width: PORTFOLIO_IMAGE.width,
          height: PORTFOLIO_IMAGE.height,
          aspect: PORTFOLIO_IMAGE.aspect,
          recommended: PORTFOLIO_IMAGE.recommended,
        }}
      />
    </div>
  );
}
