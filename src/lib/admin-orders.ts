import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/response";
import { ROLES, ORDER_STATUSES } from "@/config/constants";
import type { ApiUser } from "@/lib/api/types";
import type { AdminOrderListQuery } from "@/lib/validators/admin-orders";

/**
 * Admin order reads (Phase 1.9 scope: list with filters + full detail).
 * Quote/status mutations arrive with Phase 2 and `src/lib/orders/status.ts`.
 */

export async function listOrdersForAdmin(user: ApiUser, query: AdminOrderListQuery) {
  if (user.role !== ROLES.ADMIN) throw ApiError.notFound();

  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? {
          OR: [
            { number: { contains: query.q, mode: "insensitive" as const } },
            { user: { name: { contains: query.q, mode: "insensitive" as const } } },
            { user: { email: { contains: query.q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: query.sort === "oldest" ? "asc" : "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        id: true,
        number: true,
        status: true,
        city: true,
        createdAt: true,
        quotedAt: true,
        totalPrice: true,
        package: { select: { name: true } },
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { files: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { items, meta: { page: query.page, pageSize: query.pageSize, total } };
}

export async function getOrderForAdmin(user: ApiUser, orderId: string) {
  if (user.role !== ROLES.ADMIN) throw ApiError.notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      package: { select: { id: true, name: true, price: true, revisionLimit: true, deliverables: true } },
      user: { select: { id: true, name: true, email: true } },
      files: {
        select: { id: true, filename: true, mime: true, size: true, kind: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
      events: { orderBy: { createdAt: "desc" } },
      revisions: { orderBy: { createdAt: "desc" }, select: { id: true, number: true, status: true, createdAt: true } },
      payments: { select: { id: true, type: true, amount: true, status: true, createdAt: true } },
    },
  });

  if (!order) throw ApiError.notFound();

  return order;
}

/** Status options for admin UI filters; values from constants, never literals. */
export const ADMIN_ORDER_FILTER_STATUSES = Object.values(ORDER_STATUSES);
