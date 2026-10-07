import { prisma } from "@/lib/db";

/** Package service (catalog reads are public). */

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
