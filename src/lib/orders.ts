import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/response";
import { ORDER_STATUSES, REALTIME_EVENTS, ROLES } from "@/config/constants";
import type { ApiUser } from "@/lib/api/types";
import type { OrderInput } from "@/lib/validators/order";
import { applyStatusChange } from "@/lib/orders/status";
import { publishAdminsEvent } from "@/lib/realtime";

/** Order service (creation, ownership-safe reads, client-side transitions). */

/** FR-11: human-readable number, e.g. AP-2026-0042. */
export function generateOrderNumber(date: Date, sequence: number): string {
  const year = date.getUTCFullYear();
  return `AP-${year}-${String(sequence).padStart(4, "0")}`;
}

export async function createOrder(user: ApiUser, input: OrderInput) {
  const pkg = await prisma.package.findFirst({
    where: { id: input.packageId, active: true },
    select: { id: true },
  });
  if (!pkg) {
    throw ApiError.badRequest("Please choose a valid package.");
  }

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

/** Ownership-safe single read (404 for strangers' orders). */
export async function getOrderForUser(user: ApiUser, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      package: { select: { id: true, name: true, revisionLimit: true } },
      files: { where: { kind: "CLIENT" }, select: { id: true, filename: true, mime: true, size: true } },
    },
  });

  if (!order) throw ApiError.notFound();

  const isAdmin = user.role === ROLES.ADMIN;
  if (!isAdmin && order.userId !== user.id) {
    throw ApiError.notFound();
  }

  return order;
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
