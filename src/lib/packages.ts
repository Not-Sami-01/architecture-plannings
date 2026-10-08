import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/response";
import { type CreatePackageInput, type UpdatePackageInput } from "@/lib/validators/admin-packages";

/** Package service (catalog reads are public; writes are admin-only routes). */

export async function listActivePackages() {
  return prisma.package.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      revisionLimit: true,
      deliverables: true,
    },
  });
}

/** Admin catalog list — includes inactive packages. */
export async function listAllPackages() {
  return prisma.package.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

/** Derives a URL slug from a package name when the admin leaves the field blank. */
export function slugifyPackage(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function assertSlugFree(slug: string, exceptId?: string): Promise<void> {
  const existing = await prisma.package.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (existing && existing.id !== exceptId) {
    throw ApiError.conflict("A package with this slug already exists.");
  }
}

export async function createPackage(input: CreatePackageInput) {
  const slug = input.slug ?? slugifyPackage(input.name);
  if (!slug) {
    throw ApiError.badRequest("The package name must contain letters or numbers to build a slug.");
  }
  await assertSlugFree(slug);
  return prisma.package.create({
    data: { ...input, slug },
  });
}

export async function updatePackage(id: string, input: UpdatePackageInput) {
  const existing = await prisma.package.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw ApiError.notFound("Package not found.");
  }
  if (input.slug) {
    await assertSlugFree(input.slug, id);
  }
  return prisma.package.update({ where: { id }, data: input });
}

/** Soft delete: packages are never removed while orders reference them. */
export async function deactivatePackage(id: string) {
  const existing = await prisma.package.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw ApiError.notFound("Package not found.");
  }
  return prisma.package.update({ where: { id }, data: { active: false } });
}
