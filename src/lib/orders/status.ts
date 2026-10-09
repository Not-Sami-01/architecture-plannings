import { ORDER_STATUSES } from "@/config/constants";
import type { OrderStatus } from "@/config/constants";
import { ApiError } from "@/lib/api/response";
import type { Prisma } from "@/generated/prisma/client";

/**
 * The order status machine (AGENTS.md Architecture Rule #5). Every status
 * change in the app flows through here — never update `order.status` directly.
 *
 * Flow (PRD §4): submit → quote → advance → design → draft delivered →
 * (revision loop | final payment) → completed. `CANCELLED` is reachable from
 * any pre-completed state.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  [ORDER_STATUSES.SUBMITTED]: [ORDER_STATUSES.QUOTED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.QUOTED]: [ORDER_STATUSES.AWAITING_ADVANCE, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.AWAITING_ADVANCE]: [ORDER_STATUSES.IN_DESIGN, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.IN_DESIGN]: [ORDER_STATUSES.DRAFT_DELIVERED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.DRAFT_DELIVERED]: [
    ORDER_STATUSES.REVISION_REQUESTED,
    ORDER_STATUSES.AWAITING_FINAL_PAYMENT,
    ORDER_STATUSES.CANCELLED,
  ],
  [ORDER_STATUSES.REVISION_REQUESTED]: [ORDER_STATUSES.IN_DESIGN, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.AWAITING_FINAL_PAYMENT]: [
    ORDER_STATUSES.COMPLETED,
    ORDER_STATUSES.CANCELLED,
  ],
  [ORDER_STATUSES.COMPLETED]: [],
  [ORDER_STATUSES.CANCELLED]: [],
};

/** Statuses the UI may offer as the next target (status controls, filters). */
export function allowedTransitions(status: OrderStatus): OrderStatus[] {
  return [...(ALLOWED_TRANSITIONS[status] ?? [])];
}

/** Throws 409 INVALID_TRANSITION when `from → to` is not in the machine. */
export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) {
    throw ApiError.invalidTransition(
      `An order in “${from}” cannot move to “${to}”.`,
    );
  }
}

/**
 * Applies a validated transition: writes `order.status` and the matching
 * `OrderEvent` in one transaction so the timeline can never disagree with
 * the status. Callers must have run `assertTransition` (or validated via a
 * flow-specific guard such as `sendQuote`).
 */
export async function applyStatusChange(
  tx: Prisma.TransactionClient,
  params: {
    orderId: string;
    actorId: string;
    from: OrderStatus;
    to: OrderStatus;
    note?: string;
  },
): Promise<{ id: string; status: OrderStatus }> {
  assertTransition(params.from, params.to);

  const updated = await tx.order.update({
    where: { id: params.orderId },
    data: { status: params.to },
    select: { id: true, status: true },
  });

  await tx.orderEvent.create({
    data: {
      orderId: params.orderId,
      actorId: params.actorId,
      fromStatus: params.from,
      toStatus: params.to,
      note: params.note ?? null,
    },
  });

  return updated;
}
