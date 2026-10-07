import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/response";
import { ORDER_STATUSES, ROLES } from "@/config/constants";
import type { ApiUser } from "@/lib/api/types";
import type { OrderInput } from "@/lib/validators/order";

/** Order service (Phase 1 scope: creation and ownership-safe reads). */

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

    return tx.order.create({
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
          connect: input.fileIds.map((id) => ({ id })),
        },
      },
      select: { id: true, number: true, status: true },
    });
  });

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
