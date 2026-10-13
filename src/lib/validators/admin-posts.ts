import { z } from "zod";

import { BLOG_COVER, POST_STATUSES } from "@/config/constants";

/** Server-side re-validation for blog image uploads (multipart). */
export const postImageFileSchema = z.object({
  filename: z.string().min(1).max(255),
  mime: z.enum(BLOG_COVER.mimeTypes),
  size: z
    .number()
    .int()
    .positive("File is empty.")
    .max(BLOG_COVER.maxSourceBytes, BLOG_COVER.recommended),
});

export type PostImageFileInput = z.infer<typeof postImageFileSchema>;

/** Slug rule shared by the API and the admin form (lowercase kebab). */
export const postSlugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only.");

/** Tags are lowercase kebab chips, max 5 per post. */
export const postTagsSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1)
      .max(40)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Tags use lowercase letters, numbers and hyphens."),
  )
  .max(5, "Up to 5 tags.");

const postCoreFields = {
  title: z.string().trim().min(3, "Title is too short.").max(120),
  slug: postSlugSchema.optional(),
  excerpt: z
    .string()
    .trim()
    .min(20, "Excerpt must be at least 20 characters (it is the meta description).")
    .max(160, "Excerpt must be at most 160 characters."),
  contentHtml: z.string().max(500 * 1024, "Content is too large."),
  coverImageId: z.string().min(1).nullish(),
  tags: postTagsSchema.optional(),
  seoTitle: z.string().trim().max(60, "SEO title must be at most 60 characters.").nullish(),
  seoDescription: z
    .string()
    .trim()
    .max(160, "SEO description must be at most 160 characters.")
    .nullish(),
};

/** POST /api/admin/posts — create a draft. */
export const createPostSchema = z.object(postCoreFields);

/** PATCH /api/admin/posts/:id — at least one field required. */
export const updatePostSchema = createPostSchema
  .partial()
  .refine((value) => Object.values(value).some((v) => v !== undefined), {
    message: "Nothing to update.",
  });

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

/** POST /api/admin/posts/:id/publish */
export const publishPostSchema = z.object({
  publish: z.boolean(),
});

export type PublishPostInput = z.infer<typeof publishPostSchema>;

/** GET /api/admin/posts — filters + pagination (admin-orders pattern). */
export const postListQuerySchema = z.object({
  q: z.string().trim().min(1).max(120).optional(),
  status: z.enum([POST_STATUSES.DRAFT, POST_STATUSES.PUBLISHED]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PostListQuery = z.infer<typeof postListQuerySchema>;

/** Admin form schema: same rules, plus slug blank = auto-derive from title. */
export const postFormSchema = createPostSchema.extend({
  slug: postSlugSchema.or(z.literal("")).optional(),
  contentHtml: z.string().max(500 * 1024),
  tags: z.array(z.string().trim()).max(5),
  coverImageId: z.string().min(1).optional(),
});

export type PostFormValues = z.infer<typeof postFormSchema>;
