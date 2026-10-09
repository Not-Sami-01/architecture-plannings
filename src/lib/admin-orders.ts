import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/response";
import { REALTIME_EVENTS, ROLES, ORDER_STATUSES } from "@/config/constants";
import type { OrderStatus } from "@/config/constants";
import type { ApiUser } from "@/lib/api/types";
import type { AdminOrderListQuery, QuoteInput, StatusChangeInput } from "@/lib/validators/admin-orders";
import { assertTransition, applyStatusChange } from "@/lib/orders/status";
import { publishUserEvent } from "@/lib/realtime";

/** Admin order reads and the quote/status mutations (API.md §8). */

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

/**
 * Send a quote: sets the price terms and moves SUBMITTED → QUOTED atomically.
 * The client must see the quote and its status change as one event.
 */
export async function sendQuote(user: ApiUser, orderId: string, input: QuoteInput) {
  if (user.role !== ROLES.ADMIN) throw ApiError.notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, userId: true },
  });
  if (!order) throw ApiError.notFound();

  // Fail before writing anything: quoting only makes sense from SUBMITTED
  // (the machine's SUBMITTED → QUOTED edge).
  assertTransition(order.status, ORDER_STATUSES.QUOTED);

  const result = await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        totalPrice: input.totalPrice,
        advancePercent: input.advancePercent,
        quoteMessage: input.message ?? null,
        quotedAt: new Date(),
        status: ORDER_STATUSES.QUOTED,
      },
      select: { id: true },
    });

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        actorId: user.id,
        fromStatus: order.status,
        toStatus: ORDER_STATUSES.QUOTED,
        note: input.message ?? null,
      },
    });

    return { id: order.id, status: ORDER_STATUSES.QUOTED as OrderStatus };
  });

  // Non-blocking ping: the client's order view refetches (see realtime.ts).
  void publishUserEvent(order.userId, {
    type: REALTIME_EVENTS.quoteSent,
    refId: order.id,
  });

  return result;
}

/** Generic admin status change, validated by the status machine. */
export async function changeOrderStatus(user: ApiUser, orderId: string, input: StatusChangeInput) {
  if (user.role !== ROLES.ADMIN) throw ApiError.notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, userId: true },
  });
  if (!order) throw ApiError.notFound();

  const result = await prisma.$transaction((tx) =>
    applyStatusChange(tx, {
      orderId: order.id,
      actorId: user.id,
      from: order.status,
      to: input.to,
      note: input.reason,
    }),
  );

  // Skip the ping when the admin moved their own order (no client view to refresh).
  if (order.userId !== user.id) {
    void publishUserEvent(order.userId, {
      type: REALTIME_EVENTS.statusChanged,
      refId: order.id,
    });
  }

  return result;
}
