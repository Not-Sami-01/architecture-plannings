"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormState } from "react-hook-form";
import { ImageIcon, PlusIcon, XIcon } from "lucide-react";

import { BLOG_COVER } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageCropDialog } from "@/components/common/image-crop-dialog";
import { BlogEditor } from "@/components/admin/blog-editor-loader";
import { useUploadPostImage } from "@/hooks/admin/use-upload-post-image";
import {
  useCreatePost,
  useUpdatePost,
} from "@/hooks/admin/use-admin-post-mutations";
import type { AdminPostRow } from "@/hooks/admin/use-admin-posts";
import { slugifyPost } from "@/lib/posts/slug";
import {
  postFormSchema,
  type PostFormValues,
} from "@/lib/validators/admin-posts";

type PostFormProps = {
  /** Post being edited, or null to create a new draft. */
  post: AdminPostRow | null;
};

function toValues(post: AdminPostRow | null): PostFormValues {
  return {
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    contentHtml: post?.contentHtml ?? "",
    tags: post?.tags ?? [],
    coverImageId: post?.coverImageId ?? undefined,
    seoTitle: post?.seoTitle ?? undefined,
    seoDescription: post?.seoDescription ?? undefined,
  };
}

export function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const { actions: createActions, loadings: createLoadings } = useCreatePost();
  const { actions: updateActions, loadings: updateLoadings } = useUpdatePost();
  const { actions: uploadActions, loadings: uploadLoadings } = useUploadPostImage();

  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(
    post?.coverImageId ? `/api/posts/images/${post.coverImageId}` : null
  );
  const [tagDraft, setTagDraft] = useState("");
  const [coverError, setCoverError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: toValues(post),
  });
  const { errors } = useFormState({ control: form.control });
  const submitting = createLoadings.creating || updateLoadings.updating;
  const tags = form.watch("tags");

  useEffect(() => {
    form.reset(toValues(post));
    setCoverUrl(post?.coverImageId ? `/api/posts/images/${post.coverImageId}` : null);
    setTagDraft("");
  }, [post, form]);

  const handleCoverPicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setCoverError(null);
    setCropSrc(URL.createObjectURL(file));
  };

  const handleCoverCropped = async (blob: Blob) => {
    const { id, url } = await uploadActions.upload({ file: blob, filename: "cover.jpg" });
    form.setValue("coverImageId", id, { shouldDirty: true });
    setCoverUrl(url);
  };

  const addTag = () => {
    const tag = tagDraft.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "");
    const current = form.getValues("tags");
    if (!tag || current.includes(tag) || current.length >= 5) {
      setTagDraft("");
      return;
    }
    form.setValue("tags", [...current, tag], { shouldDirty: true });
    setTagDraft("");
  };

  const removeTag = (tag: string) => {
    const current = form.getValues("tags");
    form.setValue(
      "tags",
      current.filter((t) => t !== tag),
      { shouldDirty: true }
    );
  };

  const onSubmit = form.handleSubmit(async (values) => {
    // Blank slug = derive from title server-side via the create path; the
    // update path keeps the existing slug (published URLs stay stable).
    const slug = values.slug?.trim() || undefined;
    if (post) {
      const updated = await updateActions.update({
        id: post.id,
        input: { ...values, slug: post.status === "PUBLISHED" ? undefined : slug },
      });
      toastAndMaybeRedirect(updated.id);
    } else {
      const created = await createActions.create({ ...values, slug });
      toastAndMaybeRedirect(created.id);
    }
  });

  const toastAndMaybeRedirect = (id: string) => {
    // Success toasts live in the mutation hooks for publish; create/update
    // just land the user on the edit page so they can publish next.
    router.push(`/admin/blog/${id}`);
    router.refresh();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <FieldGroup>
          <Field data-invalid={Boolean(errors.title)}>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input
              id="title"
              placeholder="How to plan a 5 marla house"
              aria-describedby={errors.title ? "title-error" : undefined}
              {...form.register("title", {
                onBlur: () => {
                  // One-shot slug derive: only when the field is still empty.
                  if (!form.getValues("slug") && !post) {
                    const title = form.getValues("title");
                    if (title) form.setValue("slug", slugifyPost(title));
                  }
                },
              })}
            />
            {errors.title ? (
              <FieldError id="title-error">{errors.title.message}</FieldError>
            ) : null}
          </Field>

          <Field data-invalid={Boolean(errors.slug)}>
            <FieldLabel htmlFor="slug">Slug</FieldLabel>
            <Input
              id="slug"
              placeholder="auto-derived-from-title"
              disabled={post?.status === "PUBLISHED"}
              aria-describedby={errors.slug ? "slug-error" : undefined}
              {...form.register("slug")}
            />
            {post?.status === "PUBLISHED" ? (
              <p className="text-xs text-muted-foreground">
                Published slugs are locked — unpublish to change the URL.
              </p>
            ) : null}
            {errors.slug ? <FieldError id="slug-error">{errors.slug.message}</FieldError> : null}
          </Field>

          <Field data-invalid={Boolean(errors.excerpt)}>
            <FieldLabel htmlFor="excerpt">Excerpt</FieldLabel>
            <Textarea
              id="excerpt"
              rows={3}
              placeholder="Shown in search results and on cards (20–160 characters)."
              aria-describedby={errors.excerpt ? "excerpt-error" : undefined}
              {...form.register("excerpt")}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Also used as the meta description when SEO fields are empty.</span>
              <span className="tabular-nums">{form.watch("excerpt").length}/160</span>
            </div>
            {errors.excerpt ? (
              <FieldError id="excerpt-error">{errors.excerpt.message}</FieldError>
            ) : null}
          </Field>
        </FieldGroup>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Content</span>
          <BlogEditor
            value={form.watch("contentHtml")}
            onChange={(html) => form.setValue("contentHtml", html, { shouldDirty: true })}
          />
          {errors.contentHtml ? (
            <FieldError>{errors.contentHtml.message}</FieldError>
          ) : null}
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : post ? "Save changes" : "Create draft"}
          </Button>
          {post ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/blog")}
            >
              Back to posts
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={() => router.push("/admin/blog")}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <aside className="flex flex-col gap-6">
        <section className="flex flex-col gap-3 rounded-xl border p-4">
          <h2 className="font-display text-lg font-medium">Cover image</h2>
          {coverUrl ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- exact stored object */}
              <img src={coverUrl} alt="" className="h-full w-full object-cover" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground hover:bg-muted/50"
            >
              <ImageIcon className="size-5" />
              Upload cover
            </button>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept={BLOG_COVER.mimeTypes.join(",")}
            className="hidden"
            onChange={handleCoverPicked}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadLoadings.uploading}
            >
              {coverUrl ? "Replace" : "Upload"}
            </Button>
            {coverUrl ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  form.setValue("coverImageId", undefined, { shouldDirty: true });
                  setCoverUrl(null);
                }}
              >
                <XIcon data-icon="inline-start" />
                Remove
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">{BLOG_COVER.recommended}</p>
          {coverError ? <p className="text-xs text-destructive">{coverError}</p> : null}
        </section>

        <section className="flex flex-col gap-3 rounded-xl border p-4">
          <h2 className="font-display text-lg font-medium">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                  className="hover:text-destructive"
                >
                  <XIcon className="size-3" />
                </button>
              </span>
            ))}
            {tags.length === 0 ? (
              <span className="text-xs text-muted-foreground">No tags yet.</span>
            ) : null}
          </div>
          {tags.length < 5 ? (
            <div className="flex gap-2">
              <Input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="e.g. 5-marla"
                aria-label="New tag"
              />
              <Button type="button" variant="outline" size="icon-sm" onClick={addTag}>
                <PlusIcon />
              </Button>
            </div>
          ) : null}
        </section>

        <section className="flex flex-col gap-3 rounded-xl border p-4">
          <h2 className="font-display text-lg font-medium">SEO</h2>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.seoTitle)}>
              <FieldLabel htmlFor="seoTitle">SEO title (optional)</FieldLabel>
              <Input
                id="seoTitle"
                placeholder="Overrides the title in search results"
                aria-describedby={errors.seoTitle ? "seo-title-error" : undefined}
                {...form.register("seoTitle")}
              />
              {errors.seoTitle ? (
                <FieldError id="seo-title-error">{errors.seoTitle.message}</FieldError>
              ) : null}
            </Field>
            <Field data-invalid={Boolean(errors.seoDescription)}>
              <FieldLabel htmlFor="seoDescription">SEO description (optional)</FieldLabel>
              <Textarea
                id="seoDescription"
                rows={3}
                aria-describedby={errors.seoDescription ? "seo-desc-error" : undefined}
                {...form.register("seoDescription")}
              />
              {errors.seoDescription ? (
                <FieldError id="seo-desc-error">{errors.seoDescription.message}</FieldError>
              ) : null}
            </Field>
          </FieldGroup>
          <div className="rounded-lg border p-3 text-sm">
            <p className="truncate text-primary">{form.watch("seoTitle") || form.watch("title") || "Post title"}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              yoursite.com/blog/{form.watch("slug") || "post-slug"}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {form.watch("seoDescription") || form.watch("excerpt") || "Excerpt appears here…"}
            </p>
          </div>
        </section>
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
        onCropped={handleCoverCropped}
        title="Crop cover image"
        config={{
          width: BLOG_COVER.width,
          height: BLOG_COVER.height,
          aspect: BLOG_COVER.aspect,
          recommended: BLOG_COVER.recommended,
        }}
      />
    </div>
  );
}
