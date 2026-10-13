import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/response";
import {
  FILE_KINDS,
  ORDER_STATUSES,
  REALTIME_EVENTS,
  REVISION_STATUSES,
  ROLES,
} from "@/config/constants";
import type { FileKind, OrderStatus } from "@/config/constants";
import type { ApiUser } from "@/lib/api/types";
import type {
  AdminOrderListQuery,
  AdminOrderUpdateInput,
  QuoteInput,
  RegisterDraftInput,
  RegisterFinalsInput,
  StatusChangeInput,
} from "@/lib/validators/admin-orders";
import { assertTransition, applyStatusChange } from "@/lib/orders/status";
import { deleteObject } from "@/lib/storage";
import { publishAdminsEvent, publishUserEvent } from "@/lib/realtime";

/** Admin order reads, quote/status mutations, and lifecycle management (API.md §8). */

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
        currency: true,
        package: { select: { name: true } },
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
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
      assignedTo: { select: { id: true, name: true, email: true } },
      files: {
        select: {
          id: true,
          filename: true,
          mime: true,
          size: true,
          kind: true,
          createdAt: true,
          seenAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
      events: { orderBy: { createdAt: "desc" } },
      revisions: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          number: true,
          status: true,
          message: true,
          extraFeeRequired: true,
          acceptedAt: true,
          createdAt: true,
          files: { select: { id: true, filename: true, mime: true, size: true } },
        },
      },
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

/**
 * Take/release the order (plan Phase D1): assigns the current admin, or
 * null to release. NOT a status change — the timeline stays truthful.
 */
export async function takeOrder(user: ApiUser, orderId: string, take:boolean) {
  if (user.role !== ROLES.ADMIN) throw ApiError.notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true },
  });
  if (!order) throw ApiError.notFound();

  return prisma.order.update({
    where: { id: orderId },
    data: { assignedToId: take ? user.id : null },
    select: { id: true, assignedToId: true },
  });
}

/**
 * Edit order fields (plan Phase D2). Status and money are never touched here —
 * status lives on the machine, price on the quote flow.
 */
export async function updateOrderForAdmin(user: ApiUser, orderId: string, input: AdminOrderUpdateInput) {
  if (user.role !== ROLES.ADMIN) throw ApiError.notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true },
  });
  if (!order) throw ApiError.notFound();

  return prisma.order.update({
    where: { id: orderId },
    data: {
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.plot !== undefined ? { plotWidth: input.plot.width, plotLength: input.plot.length, plotUnit: input.plot.unit } : {}),
      ...(input.requirements !== undefined
        ? {
            floors: input.requirements.floors,
            bedrooms: input.requirements.bedrooms,
            bathrooms: input.requirements.bathrooms,
            kitchenType: input.requirements.kitchenType,
            garage: input.requirements.garage,
            lounge: input.requirements.lounge,
            extras: input.requirements.extras || null,
          }
        : {}),
      ...(input.style !== undefined ? { style: input.style } : {}),
      ...(input.budget !== undefined ? { budget: input.budget } : {}),
      ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
      ...(input.packageId !== undefined ? { packageId: input.packageId } : {}),
    },
    select: { id: true },
  });
}

/**
 * Admin hard delete (plan decision 1): rows cascade in one transaction after
 * every storage object is purged. Payment-proof rows are deleted here too —
 * deleting an order removes its whole financial record deliberately.
 * Clients see "Order not found" afterwards (existing 404 branch).
 */
export async function deleteOrderForAdmin(user: ApiUser, orderId: string) {
  if (user.role !== ROLES.ADMIN) throw ApiError.notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, files: { select: { key: true } } },
  });
  if (!order) throw ApiError.notFound();

  // Purge storage first — no orphaned bytes if the transaction then fails
  // (plan Risks/guardrails). Failures are already logged inside deleteObject.
  await Promise.all(order.files.map((file) => deleteObject(file.key).catch(() => undefined)));

  await prisma.$transaction(async (tx) => {
    // Explicit deletes: no silent onDelete surprises (plan guardrail).
    await tx.orderFile.deleteMany({ where: { orderId } });
    await tx.message.deleteMany({ where: { orderId } });
    await tx.orderEvent.deleteMany({ where: { orderId } });
    await tx.revision.deleteMany({ where: { orderId } });
    await tx.payment.deleteMany({ where: { orderId } });
    await tx.testimonial.deleteMany({ where: { orderId } });
    await tx.order.delete({ where: { id: orderId } });
  });

  // Keep the client's open detail page live ("Order not found" appears).
  void publishUserEvent(order.userId, {
    type: REALTIME_EVENTS.statusChanged,
    refId: orderId,
  });
}

/**
 * Confirms the submitted file ids exist on this order, are uploaded by an
 * admin, are confirmed, and carry one of the expected kinds. Any mismatch is
 * a 400 — the admin UI only offers valid files, so this is belt-and-braces
 * against stale tabs and crafted requests.
 */
async function requireDeliverableFiles(orderId: string, fileIds: string[], kinds: FileKind[]) {
  const files = await prisma.orderFile.findMany({
    where: { id: { in: fileIds }, orderId },
    select: { id: true, filename: true, kind: true, confirmedAt: true },
  });

  const byId = new Map(files.map((f) => [f.id, f]));
  for (const fileId of fileIds) {
    const file = byId.get(fileId);
    if (!file || !file.confirmedAt || !kinds.includes(file.kind)) {
      throw ApiError.badRequest(
        "Those files are not ready to deliver. Re-upload them or refresh the page.",
      );
    }
  }
  return files;
}

/**
 * Deliver the draft (plan 3 P3): IN_DESIGN → DRAFT_DELIVERED with the files
 * and an optional note; open revisions are auto-closed in the same tx.
 */
export async function registerDraft(user: ApiUser, orderId: string, input: RegisterDraftInput) {
  if (user.role !== ROLES.ADMIN) throw ApiError.notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, userId: true },
  });
  if (!order) throw ApiError.notFound();

  // The machine only allows DRAFT_DELIVERED from IN_DESIGN (409 INVALID_TRANSITION).
  assertTransition(order.status, ORDER_STATUSES.DRAFT_DELIVERED);

  const files = await requireDeliverableFiles(orderId, input.fileIds, [
    FILE_KINDS.DRAFT_PREVIEW,
    FILE_KINDS.DRAFT_ORIGINAL,
  ]);
  if (files.length === 0) {
    throw ApiError.badRequest("Pick at least one draft file.");
  }

  const filenames = files.map((f) => f.filename).join(", ");
  const note = input.note ? `${filenames} — ${input.note}` : filenames;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await applyStatusChange(tx, {
      orderId: order.id,
      actorId: user.id,
      from: order.status,
      to: ORDER_STATUSES.DRAFT_DELIVERED,
      note,
    });

    // A fresh draft supersedes any still-open revision (loop restarts clean).
    await tx.revision.updateMany({
      where: { orderId: order.id, status: REVISION_STATUSES.OPEN },
      data: { status: REVISION_STATUSES.DONE },
    });

    return updated;
  });

  if (order.userId !== user.id) {
    void publishUserEvent(order.userId, {
      type: REALTIME_EVENTS.statusChanged,
      refId: order.id,
    });
  }
  void publishAdminsEvent({
    type: REALTIME_EVENTS.draftDelivered,
    refId: order.id,
  });

  return result;
}

/** Statuses from which finals may be registered (design must be under way). */
const FINALS_ALLOWED: readonly OrderStatus[] = [
  ORDER_STATUSES.IN_DESIGN,
  ORDER_STATUSES.DRAFT_DELIVERED,
  ORDER_STATUSES.REVISION_REQUESTED,
  ORDER_STATUSES.AWAITING_FINAL_PAYMENT,
];

/**
 * Register the final files (plan 3 P3): no status change — the COMPLETED edge
 * stays gated on verified final payment. Leaves a timeline note listing the
 * files so the client can see what is waiting for them.
 */
export async function registerFinals(user: ApiUser, orderId: string, input: RegisterFinalsInput) {
  if (user.role !== ROLES.ADMIN) throw ApiError.notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true },
  });
  if (!order) throw ApiError.notFound();

  if (!FINALS_ALLOWED.includes(order.status)) {
    throw ApiError.badRequest(
      "Final files can only be registered once the order is in design or later.",
    );
  }

  const files = await requireDeliverableFiles(orderId, input.fileIds, [FILE_KINDS.FINAL]);
  if (files.length === 0) {
    throw ApiError.badRequest("Pick at least one final file.");
  }

  const filenames = files.map((f) => f.filename).join(", ");

  // Same-status event: the timeline renders it as a note, not a transition.
  await prisma.orderEvent.create({
    data: {
      orderId: order.id,
      actorId: user.id,
      fromStatus: order.status,
      toStatus: order.status,
      note: `Final files registered: ${filenames}`,
    },
  });

  void publishAdminsEvent({
    type: REALTIME_EVENTS.finalsRegistered,
    refId: order.id,
  });

  return { orderId: order.id, fileCount: files.length };
}
