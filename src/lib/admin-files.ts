import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/response";
import { deleteObject } from "@/lib/storage";
import { ROLES } from "@/config/constants";
import type { ApiUser } from "@/lib/api/types";
import type { AdminFileListQuery, AdminFileUpdateInput } from "@/lib/validators/admin-files";

/** Admin files management (plan C3). */

export async function listFilesForAdmin(user: ApiUser, query: AdminFileListQuery) {
  if (user.role !== ROLES.ADMIN) throw ApiError.notFound();

  const where = {
    ...(query.kind ? { kind: query.kind } : {}),
    ...(query.q
      ? {
          OR: [
            { filename: { contains: query.q, mode: "insensitive" as const } },
            { order: { number: { contains: query.q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.orderFile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        filename: true,
        mime: true,
        size: true,
        kind: true,
        confirmedAt: true,
        createdAt: true,
        orderId: true,
        order: { select: { id: true, number: true } },
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.orderFile.count({ where }),
  ]);

  return { items, meta: { page: query.page, pageSize: query.pageSize, total } };
}

export async function updateFileForAdmin(user: ApiUser, fileId: string, input: AdminFileUpdateInput) {
  if (user.role !== ROLES.ADMIN) throw ApiError.notFound();

  const file = await prisma.orderFile.findUnique({ where: { id: fileId }, select: { id: true } });
  if (!file) throw ApiError.notFound();

  return prisma.orderFile.update({
    where: { id: fileId },
    data: {
      ...(input.filename !== undefined ? { filename: input.filename } : {}),
      ...(input.kind !== undefined ? { kind: input.kind } : {}),
    },
    select: {
      id: true,
      filename: true,
      mime: true,
      size: true,
      kind: true,
      confirmedAt: true,
      createdAt: true,
      orderId: true,
      order: { select: { id: true, number: true } },
      uploadedBy: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * Hard-deletes a file row and its storage object. Payment proofs are blocked
 * — they are financial records referenced by payments (plan guardrail).
 */
export async function deleteFileForAdmin(user: ApiUser, fileId: string) {
  if (user.role !== ROLES.ADMIN) throw ApiError.notFound();

  const file = await prisma.orderFile.findUnique({
    where: { id: fileId },
    select: { id: true, key: true, kind: true, paymentProof: { select: { id: true } } },
  });

  if (!file) throw ApiError.notFound();
  if (file.paymentProof) {
    throw ApiError.conflict("Payment proofs cannot be deleted while a payment references them.");
  }

  await deleteObject(file.key);
  await prisma.orderFile.delete({ where: { id: fileId } });
}
