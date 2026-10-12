import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/response";
import {
  FILE_KINDS,
  ORDER_STATUSES,
  REALTIME_EVENTS,
  ROLES,
  type FileKind,
  type OrderStatus,
} from "@/config/constants";
import type { ApiUser } from "@/lib/api/types";
import type { OrderInput } from "@/lib/validators/order";
import { applyStatusChange } from "@/lib/orders/status";
import { publishAdminsEvent } from "@/lib/realtime";
import { getSiteSettings } from "@/lib/settings";

/** Order service (creation, ownership-safe reads, client-side transitions). */

/** FR-11: human-readable number, e.g. AP-2026-0042. */
export function generateOrderNumber(date: Date, sequence: number): string {
  const year = date.getUTCFullYear();
  return `AP-${year}-${String(sequence).padStart(4, "0")}`;
}

export async function createOrder(user: ApiUser, input: OrderInput) {
  // Panel separation (plan Phase A): the designer is a fulfilment account,
  // not a customer — their orders would appear on no one's dashboard.
  if (user.role === ROLES.ADMIN) {
    throw ApiError.forbidden("Admin accounts cannot place orders.");
  }

  const pkg = await prisma.package.findFirst({
    where: { id: input.packageId, active: true },
    select: { id: true },
  });
  if (!pkg) {
    throw ApiError.badRequest("Please choose a valid package.");
  }

  // Currency snapshot (plan 3): this order's money always displays in the
  // currency that was live when the client submitted it.
  const { currency } = await getSiteSettings();

  const order = await prisma.$transaction(async (tx) => {
    // FR-11: per-year sequence derived from the current count. Unique constraint
    // on `number` plus retry would harden this further; fine for launch volume.
    const year = new Date().getUTCFullYear();
    const count = await tx.order.count({
      where: { createdAt: { gte: new Date(`${year}-01-01T00:00:00.000Z`) } },
    });
    const number = generateOrderNumber(new Date(), count + 1);

    // Ownership check (Security Rules): only attach files this user uploaded —
    // never trust client-supplied ids beyond validation.
    const ownedFiles = input.fileIds.length
      ? await tx.orderFile.findMany({
          where: { id: { in: input.fileIds }, uploadedById: user.id },
          select: { id: true },
        })
      : [];

    const created = await tx.order.create({
      data: {
        number,
        userId: user.id,
        packageId: input.packageId,
        status: ORDER_STATUSES.SUBMITTED,
        plotWidth: input.plot.width,
        plotLength: input.plot.length,
        plotUnit: input.plot.unit,
        facing: input.plot.facing,
        roadSides: input.plot.roadSides,
        city: input.plot.city,
        floors: input.requirements.floors,
        bedrooms: input.requirements.bedrooms,
        bathrooms: input.requirements.bathrooms,
        kitchenType: input.requirements.kitchenType,
        garage: input.requirements.garage,
        lounge: input.requirements.lounge,
        extras: input.requirements.extras || null,
        style: input.style,
        budget: input.budget ? Number(input.budget) : null,
        notes: input.notes || null,
        currency,
        // Attach client uploads (they were registered without an order).
        files: {
          connect: ownedFiles.map((file) => ({ id: file.id })),
        },
      },
      select: { id: true, number: true, status: true },
    });

    // The admin timeline reads `OrderEvent`; a submission without one looks
    // like "no history". Status transitions later follow lib/orders/status.ts.
    await tx.orderEvent.create({
      data: {
        orderId: created.id,
        actorId: user.id,
        fromStatus: null,
        toStatus: ORDER_STATUSES.SUBMITTED,
      },
    });

    return created;
  });

  // Admin order list refreshes (non-blocking; see realtime.ts).
  void publishAdminsEvent({ type: REALTIME_EVENTS.orderCreated, refId: order.id });

  return order;
}

/**
 * Deliverable statuses, cheapest-first (plan Phase D5). Once an order reaches
 * a step, every later step also qualifies for draft previews.
 */
const DELIVERABLE_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  ORDER_STATUSES.DRAFT_DELIVERED,
  ORDER_STATUSES.REVISION_REQUESTED,
  ORDER_STATUSES.AWAITING_FINAL_PAYMENT,
  ORDER_STATUSES.COMPLETED,
] as OrderStatus[]);

/** Ownership-safe single read (404 for strangers' orders). */
export async function getOrderForUser(user: ApiUser, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      package: { select: { id: true, name: true, revisionLimit: true } },
      revisions: {
        orderBy: { number: "asc" },
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
    },
  });

  if (!order) throw ApiError.notFound();

  // Status-aware file visibility is the security boundary (plan Phase D5):
  // CLIENT uploads always; previews once a draft was delivered; finals only
  // when the final payment is verified (mirrors the download route's 402).
  // ORIGINAL drafts are never sent to clients — the download route 404s them.
  const isAdmin = user.role === ROLES.ADMIN;
  if (!isAdmin && order.userId !== user.id) {
    throw ApiError.notFound();
  }

  const deliverablesReached = DELIVERABLE_STATUSES.has(order.status as OrderStatus);
  const includePreviews = isAdmin || deliverablesReached;
  const includeFinals = isAdmin || (deliverablesReached && order.finalPaymentVerified);

  const allowedKinds: FileKind[] = [
    FILE_KINDS.CLIENT,
    ...(includePreviews ? [FILE_KINDS.DRAFT_PREVIEW, FILE_KINDS.REVISION_REF] : []),
    ...(includeFinals ? [FILE_KINDS.FINAL] : []),
  ];

  const files = await prisma.orderFile.findMany({
    where: { orderId: order.id, kind: { in: allowedKinds } },
    select: { id: true, filename: true, mime: true, size: true, kind: true },
    orderBy: { createdAt: "asc" },
  });

  return { ...order, files };
}

export async function listOrdersForUser(user: ApiUser) {
  return prisma.order.findMany({
    where: user.role === ROLES.ADMIN ? {} : { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      number: true,
      status: true,
      city: true,
      createdAt: true,
      package: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
  });
}

/**
 * Ownership-safe read for the client transition endpoints: strangers get 404
 * (existence is never leaked), the current status is validated by the machine.
 */
async function getOrderForTransition(user: ApiUser, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, status: true },
  });
  if (!order || order.userId !== user.id) throw ApiError.notFound();
  return order;
}

/** Client accepts the quote: QUOTED → AWAITING_ADVANCE. */
export async function acceptQuote(user: ApiUser, orderId: string) {
  const order = await getOrderForTransition(user, orderId);

  const result = await prisma.$transaction((tx) =>
    applyStatusChange(tx, {
      orderId: order.id,
      actorId: user.id,
      from: order.status,
      to: ORDER_STATUSES.AWAITING_ADVANCE,
    }),
  );

  void publishAdminsEvent({ type: REALTIME_EVENTS.statusChanged, refId: order.id });
  return result;
}

/** Client approves the delivered draft: DRAFT_DELIVERED → AWAITING_FINAL_PAYMENT. */
export async function approveDraft(user: ApiUser, orderId: string) {
  const order = await getOrderForTransition(user, orderId);

  const result = await prisma.$transaction((tx) =>
    applyStatusChange(tx, {
      orderId: order.id,
      actorId: user.id,
      from: order.status,
      to: ORDER_STATUSES.AWAITING_FINAL_PAYMENT,
    }),
  );

  void publishAdminsEvent({ type: REALTIME_EVENTS.statusChanged, refId: order.id });
  return result;
}
