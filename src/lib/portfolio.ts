import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";

import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/response";
import {
  PORTFOLIO_CACHE_TAG,
  PORTFOLIO_IMAGE,
  PORTFOLIO_PLOT_SIZES,
  PORTFOLIO_STYLE_OPTIONS,
} from "@/config/constants";
import { buildPortfolioImageKey, deleteObject, putObject } from "@/lib/storage";
import { slugifyPortfolio } from "@/lib/portfolio/slug";
import { portfolioImageFileSchema } from "@/lib/validators/admin-portfolio";
import type {
  CreatePortfolioProjectInput,
  PortfolioListQuery,
  UpdatePortfolioProjectInput,
} from "@/lib/validators/admin-portfolio";

export { slugifyPortfolio };

/**
 * Portfolio projects (Phase 5). Public reads go through unstable_cache tagged
 * PORTFOLIO_CACHE_TAG; every write revalidateTag's it ({ expire: 0 } = blocking
 * miss, the posts.ts pattern). Gallery images are OrderFile rows of kind
 * PORTFOLIO_IMAGE; `images` stores their IDs in display order (first = cover).
 */

const projectListSelect = {
  id: true,
  slug: true,
  title: true,
  category: true,
  plotSize: true,
  style: true,
  description: true,
  images: true,
  featured: true,
  visible: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} as const;

type ProjectRow = {
  createdAt: Date | string;
  updatedAt: Date | string;
};

/** unstable_cache JSON-serializes, so Dates come back as strings on hits. */
function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

function rehydrateProjectDates<T extends ProjectRow>(row: T): T {
  return {
    ...row,
    createdAt: toDate(row.createdAt) as T["createdAt"],
    updatedAt: toDate(row.updatedAt) as T["updatedAt"],
  };
}

/** "5-marla" → "5 marla"; unknown tokens fall through unchanged for a LIKE match. */
function plotTokenToValue(token: string): string {
  const match = PORTFOLIO_PLOT_SIZES.find(
    (value) => value.toLowerCase().replace(/\s+/g, "-") === token.toLowerCase(),
  );
  return match ?? token;
}

/** "modern" → "MODERN"; null when the token matches no known style. */
function styleTokenToValue(token: string): string | null {
  const match = PORTFOLIO_STYLE_OPTIONS.find(
    (option) => option.token === token.toLowerCase(),
  );
  return match ? match.value : null;
}

function buildPublicWhere(query: PortfolioListQuery) {
  const style = query.style ? styleTokenToValue(query.style) : undefined;
  return {
    visible: true,
    ...(query.plot
      ? { plotSize: { equals: plotTokenToValue(query.plot), mode: "insensitive" as const } }
      : {}),
    ...(query.style
      ? style
        ? { style: style as never }
        : { style: "IMPOSSIBLE_MATCH" as never }
      : {}),
    ...(query.category
      ? { category: { equals: query.category, mode: "insensitive" as const } }
      : {}),
  };
}

async function readVisibleProjects(query: PortfolioListQuery) {
  return prisma.portfolioProject.findMany({
    where: buildPublicWhere(query),
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    select: projectListSelect,
  });
}

async function readVisibleProjectBySlug(slug: string) {
  return prisma.portfolioProject.findFirst({
    where: { slug, visible: true },
    select: projectListSelect,
  });
}

const cachedVisibleProjects = unstable_cache(
  readVisibleProjects,
  ["portfolio", "visible"],
  { tags: [PORTFOLIO_CACHE_TAG] },
);

const cachedVisibleProjectBySlug = unstable_cache(
  readVisibleProjectBySlug,
  ["portfolio", "by-slug"],
  { tags: [PORTFOLIO_CACHE_TAG] },
);

/** Cached public reads — invalidated by revalidateTag(PORTFOLIO_CACHE_TAG). */
export async function listVisibleProjects(query: PortfolioListQuery) {
  const rows = await cachedVisibleProjects(query);
  return rows.map((row) => rehydrateProjectDates(row));
}

export async function getVisibleProjectBySlug(slug: string) {
  const row = await cachedVisibleProjectBySlug(slug);
  return row ? rehydrateProjectDates(row) : null;
}

/** Sitemap helper: every visible project, light select. */
export async function listVisibleProjectSlugs() {
  return prisma.portfolioProject.findMany({
    where: { visible: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: { slug: true, updatedAt: true },
  });
}

/** Admin list — includes hidden rows, display order. */
export async function adminListProjects() {
  const rows = await prisma.portfolioProject.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    select: projectListSelect,
  });
  return rows.map((row) => rehydrateProjectDates(row));
}

export async function getProjectForAdmin(id: string) {
  const project = await prisma.portfolioProject.findUnique({
    where: { id },
    select: projectListSelect,
  });
  if (!project) throw ApiError.notFound("Project not found.");
  return rehydrateProjectDates(project);
}

async function assertSlugFree(slug: string): Promise<void> {
  const existing = await prisma.portfolioProject.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (existing) {
    throw ApiError.conflict("A project with this slug already exists.");
  }
}

function invalidatePortfolio(): void {
  revalidateTag(PORTFOLIO_CACHE_TAG, { expire: 0 });
}

/** Resolves image IDs to rows and rejects foreign/missing IDs. */
async function assertImageIds(imageIds: string[]): Promise<{ id: string; key: string }[]> {
  if (imageIds.length === 0) return [];
  const rows = await prisma.orderFile.findMany({
    where: { id: { in: imageIds }, kind: "PORTFOLIO_IMAGE" },
    select: { id: true, key: true },
  });
  const found = new Set(rows.map((row) => row.id));
  if (imageIds.some((id) => !found.has(id))) {
    throw ApiError.badRequest("One or more images are missing. Re-upload them.");
  }
  // Preserve caller order (first image = cover).
  return imageIds.map((id) => rows.find((row) => row.id === id)!);
}

/** Purges removed gallery images (rows + objects) after an update/delete. */
function purgeImages(files: { id: string; key: string }[]): void {
  for (const file of files) {
    void deleteObject(file.key);
    void prisma.orderFile.delete({ where: { id: file.id } }).catch(() => {});
  }
}

export async function createPortfolioProject(input: CreatePortfolioProjectInput) {
  const slug = input.slug ?? slugifyPortfolio(input.title);
  if (!slug) {
    throw ApiError.badRequest("The title must contain letters or numbers to build a slug.");
  }
  await assertSlugFree(slug);
  await assertImageIds(input.imageIds ?? []);

  const maxSort = await prisma.portfolioProject.aggregate({
    _max: { sortOrder: true },
  });

  return prisma.portfolioProject.create({
    data: {
      title: input.title,
      slug,
      category: input.category,
      plotSize: input.plotSize,
      style: input.style,
      description: input.description ?? null,
      featured: input.featured ?? false,
      visible: input.visible ?? true,
      images: input.imageIds ?? [],
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
  });
}

export async function updatePortfolioProject(
  id: string,
  input: UpdatePortfolioProjectInput,
) {
  const existing = await prisma.portfolioProject.findUnique({
    where: { id },
    select: { id: true, images: true },
  });
  if (!existing) throw ApiError.notFound("Project not found.");

  // Slug is immutable after create (stable URLs for SEO). imageIds maps to
  // the `images` column below and must not reach Prisma directly.
  const { slug: _slug, imageIds, ...fields } = input;
  void _slug;

  if (imageIds) {
    await assertImageIds(imageIds);
  }

  const project = await prisma.portfolioProject.update({
    where: { id },
    data: {
      ...fields,
      ...(imageIds ? { images: imageIds } : {}),
    },
  });

  if (imageIds) {
    const keep = new Set(imageIds);
    const removedIds = existing.images.filter((fileId) => !keep.has(fileId));
    if (removedIds.length > 0) {
      const removed = await prisma.orderFile.findMany({
        where: { id: { in: removedIds } },
        select: { id: true, key: true },
      });
      purgeImages(removed);
    }
  }

  invalidatePortfolio();
  return project;
}

export async function deletePortfolioProject(id: string) {
  const existing = await prisma.portfolioProject.findUnique({
    where: { id },
    select: { id: true, images: true },
  });
  if (!existing) throw ApiError.notFound("Project not found.");

  await prisma.portfolioProject.delete({ where: { id } });
  invalidatePortfolio();

  const files = await prisma.orderFile.findMany({
    where: { id: { in: existing.images } },
    select: { id: true, key: true },
  });
  purgeImages(files);
  return { id };
}

/** Full-set reorder; validates the ids match the existing set exactly. */
export async function reorderPortfolioProjects(ids: string[]) {
  const existing = await prisma.portfolioProject.findMany({
    select: { id: true },
  });
  const existingSet = new Set(existing.map((row) => row.id));
  const nextSet = new Set(ids);
  if (
    ids.length !== existing.length ||
    [...existingSet].some((id) => !nextSet.has(id))
  ) {
    throw ApiError.badRequest("Reorder must include every project exactly once.");
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.portfolioProject.update({
        where: { id },
        data: { sortOrder: index + 1 },
      }),
    ),
  );
  invalidatePortfolio();
  return { count: ids.length };
}

/** Portfolio image upload (multipart): re-validate, store, return the row. */
export async function createPortfolioImage(
  uploaderId: string,
  file: { name: string; type: string; size: number },
  bytes: Buffer,
) {
  const parsed = portfolioImageFileSchema.safeParse({
    filename: file.name,
    mime: file.type,
    size: file.size,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.code === "too_big") throw ApiError.fileTooLarge(issue.message);
    if (issue?.path.includes("mime")) {
      throw ApiError.unsupportedFileType(PORTFOLIO_IMAGE.recommended);
    }
    throw ApiError.badRequest(issue?.message ?? "Invalid image.");
  }

  const key = buildPortfolioImageKey({
    fileId: crypto.randomUUID(),
    filename: parsed.data.filename,
  });
  await putObject(key, bytes, parsed.data.mime);

  try {
    return await prisma.orderFile.create({
      data: {
        key,
        filename: parsed.data.filename,
        mime: parsed.data.mime,
        size: file.size,
        kind: "PORTFOLIO_IMAGE",
        uploadedById: uploaderId,
      },
      select: { id: true, filename: true, key: true },
    });
  } catch (error) {
    await deleteObject(key);
    throw error;
  }
}

/** Public image lookup for the serve route — kind-checked. */
export async function getPortfolioImageFile(fileId: string) {
  const file = await prisma.orderFile.findUnique({
    where: { id: fileId },
    select: { id: true, key: true, mime: true, kind: true },
  });
  if (!file || file.kind !== "PORTFOLIO_IMAGE") throw ApiError.notFound();
  return file;
}
