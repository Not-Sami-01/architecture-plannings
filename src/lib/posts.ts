import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";

import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/response";
import { BLOG_COVER, POSTS_CACHE_TAG, POST_STATUSES } from "@/config/constants";
import { deleteObject, putObject, buildPostImageKey } from "@/lib/storage";
import { sanitizePostHtml } from "@/lib/posts/sanitize";
import { readingMinutesFromHtml } from "@/lib/posts/reading-time";
import { slugifyPost } from "@/lib/posts/slug";
import type {
  CreatePostInput,
  PostListQuery,
  UpdatePostInput,
} from "@/lib/validators/admin-posts";
import { postImageFileSchema } from "@/lib/validators/admin-posts";

export { slugifyPost };

/**
 * Blog posts (plan 6). Public reads go through unstable_cache tagged
 * POSTS_CACHE_TAG; every write revalidateTag's it ({ expire: 0 } = blocking
 * miss, the Next 16 route-handler form used by settings.ts). Marketing Server
 * Components call these directly — no HTTP hop.
 */

const postListSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  tags: true,
  status: true,
  readingMinutes: true,
  publishedAt: true,
  updatedAt: true,
  coverImageId: true,
  author: { select: { name: true } },
} as const;

async function readPublishedPosts(input: { tag?: string; limit: number }) {
  return prisma.post.findMany({
    where: {
      status: POST_STATUSES.PUBLISHED,
      ...(input.tag ? { tags: { has: input.tag } } : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: input.limit,
    select: postListSelect,
  });
}

async function readPublishedPostBySlug(slug: string) {
  return prisma.post.findFirst({
    where: { slug, status: POST_STATUSES.PUBLISHED },
    select: {
      ...postListSelect,
      contentHtml: true,
      seoTitle: true,
      seoDescription: true,
      createdAt: true,
    },
  });
}

async function readPublishedTags(): Promise<string[]> {
  const rows = await prisma.post.findMany({
    where: { status: POST_STATUSES.PUBLISHED },
    select: { tags: true },
  });
  return [...new Set(rows.flatMap((row) => row.tags))].sort();
}

/** Cached public reads — invalidated by revalidateTag(POSTS_CACHE_TAG) on writes. */
export const listPublishedPosts = unstable_cache(
  readPublishedPosts,
  ["posts", "list-published"],
  { tags: [POSTS_CACHE_TAG] },
);

export const getPublishedPostBySlug = unstable_cache(
  readPublishedPostBySlug,
  ["posts", "by-slug"],
  { tags: [POSTS_CACHE_TAG] },
);

export const listPublishedTags = unstable_cache(readPublishedTags, ["posts", "tags"], {
  tags: [POSTS_CACHE_TAG],
});

export function listRecentPublishedPosts(limit = 3) {
  return listPublishedPosts({ limit });
}

/** Admin list with filters + pagination (admin-orders pattern). */
export async function adminListPosts(query: PostListQuery) {
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: "insensitive" as const } },
            { slug: { contains: query.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        ...postListSelect,
        seoTitle: true,
        seoDescription: true,
        contentHtml: true,
        coverImageId: true,
      },
    }),
    prisma.post.count({ where }),
  ]);

  return { items, meta: { page: query.page, pageSize: query.pageSize, total } };
}

export async function getPostForAdmin(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      ...postListSelect,
      contentHtml: true,
      seoTitle: true,
      seoDescription: true,
      coverImageId: true,
      authorId: true,
      createdAt: true,
    },
  });
  if (!post) throw ApiError.notFound("Post not found.");
  return post;
}

async function assertSlugFree(slug: string, exceptId?: string): Promise<void> {
  const existing = await prisma.post.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (existing && existing.id !== exceptId) {
    throw ApiError.conflict("A post with this slug already exists.");
  }
}

function invalidatePosts(): void {
  revalidateTag(POSTS_CACHE_TAG, { expire: 0 });
}

export async function createPost(authorId: string, input: CreatePostInput) {
  const slug = input.slug ?? slugifyPost(input.title);
  if (!slug) {
    throw ApiError.badRequest("The title must contain letters or numbers to build a slug.");
  }
  await assertSlugFree(slug);

  const contentHtml = sanitizePostHtml(input.contentHtml ?? "");
  return prisma.post.create({
    data: {
      ...input,
      slug,
      contentHtml,
      readingMinutes: readingMinutesFromHtml(contentHtml),
      authorId,
    },
  });
}

export async function updatePost(id: string, input: UpdatePostInput) {
  const existing = await prisma.post.findUnique({
    where: { id },
    select: { id: true, status: true, slug: true },
  });
  if (!existing) throw ApiError.notFound("Post not found.");

  // SEO safety: published URLs never change (plan 6 decision 6).
  if (
    input.slug &&
    input.slug !== existing.slug &&
    existing.status === POST_STATUSES.PUBLISHED
  ) {
    throw ApiError.conflict(
      "Unpublish the post before changing its slug — published URLs must stay stable.",
    );
  }
  if (input.slug) await assertSlugFree(input.slug, id);

  const data: Record<string, unknown> = { ...input };
  if (input.contentHtml !== undefined) {
    const contentHtml = sanitizePostHtml(input.contentHtml);
    data.contentHtml = contentHtml;
    data.readingMinutes = readingMinutesFromHtml(contentHtml);
  }

  const updated = await prisma.post.update({ where: { id }, data });
  invalidatePosts();
  return updated;
}

/** Publish/unpublish. publishedAt stamps on the FIRST publish only. */
export async function setPostPublished(id: string, publish: boolean) {
  const existing = await prisma.post.findUnique({
    where: { id },
    select: { id: true, status: true, publishedAt: true, title: true, excerpt: true, contentHtml: true },
  });
  if (!existing) throw ApiError.notFound("Post not found.");

  if (publish && existing.status !== POST_STATUSES.PUBLISHED) {
    // Never ship an empty shell to search engines.
    if (!existing.title.trim() || existing.excerpt.trim().length < 20 || !existing.contentHtml.trim()) {
      throw ApiError.badRequest(
        "Add a title, an excerpt (20+ characters) and content before publishing.",
      );
    }
  }

  const updated = await prisma.post.update({
    where: { id },
    data: publish
      ? { status: POST_STATUSES.PUBLISHED, publishedAt: existing.publishedAt ?? new Date() }
      : { status: POST_STATUSES.DRAFT },
  });
  invalidatePosts();
  return updated;
}

/** Hard delete; the cover object + row go with it. */
export async function deletePost(id: string) {
  const existing = await prisma.post.findUnique({
    where: { id },
    select: { id: true, coverImageId: true, coverImage: { select: { key: true } } },
  });
  if (!existing) throw ApiError.notFound("Post not found.");

  await prisma.post.delete({ where: { id } });
  invalidatePosts();

  if (existing.coverImage) {
    void deleteObject(existing.coverImage.key);
    void prisma.orderFile.delete({ where: { id: existing.coverImageId! } }).catch(() => {});
  }
  return { id };
}

/** Blog image upload (plan 6): server re-validation, then storage + row. */
export async function createPostImage(
  uploaderId: string,
  file: { name: string; type: string; size: number },
  bytes: Buffer,
) {
  const parsed = postImageFileSchema.safeParse({
    filename: file.name,
    mime: file.type,
    size: file.size,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.code === "too_big") throw ApiError.fileTooLarge(issue.message);
    if (issue?.path.includes("mime")) throw ApiError.unsupportedFileType(BLOG_COVER.recommended);
    throw ApiError.badRequest(issue?.message ?? "Invalid image.");
  }

  const key = buildPostImageKey({
    fileId: crypto.randomUUID(),
    filename: parsed.data.filename,
  });
  await putObject(key, bytes, parsed.data.mime);

  try {
    const row = await prisma.orderFile.create({
      data: {
        key,
        filename: parsed.data.filename,
        mime: parsed.data.mime,
        size: file.size,
        kind: "POST_IMAGE",
        uploadedById: uploaderId,
        confirmedAt: new Date(),
      },
      select: { id: true, key: true },
    });
    return row;
  } catch (error) {
    await deleteObject(key);
    throw error;
  }
}

/** Public image lookup — only POST_IMAGE rows ever leave through this path. */
export async function getPostImageFile(fileId: string) {
  const file = await prisma.orderFile.findUnique({
    where: { id: fileId },
    select: { id: true, key: true, mime: true, kind: true },
  });
  if (!file || file.kind !== "POST_IMAGE") throw ApiError.notFound();
  return file;
}

/** Cover picker helper: resolve the current cover row for the editor preview. */
export async function getPostCoverImage(coverImageId: string | null) {
  if (!coverImageId) return null;
  return prisma.orderFile.findUnique({
    where: { id: coverImageId },
    select: { id: true, filename: true },
  });
}
