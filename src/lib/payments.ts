import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/response";
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  PAYMENT_TYPE_LABELS,
  REALTIME_EVENTS,
  ROLES,
  type PaymentType,
} from "@/config/constants";
import type { ApiUser } from "@/lib/api/types";
import type {
  CreatePaymentInput,
  PaymentProofInput,
  VerifyPaymentInput,
} from "@/lib/validators/payments";
import { formatMoney } from "@/lib/format";
import { publishAdminsEvent, publishUserEvent } from "@/lib/realtime";

/**
 * Manual payment requests (plan 2 P4 — Phase 4 minimal slice): the admin
 * creates a charge, the client uploads a transfer proof, the admin verifies.
 * Statuses never move automatically — that stays on the status machine.
 */

const paymentSelect = {
  id: true,
  type: true,
  amount: true,
  status: true,
  note: true,
  createdAt: true,
  updatedAt: true,
  proofFile: { select: { id: true, filename: true, mime: true, size: true } },
} as const;

async function requireAdmin(user: ApiUser) {
  if (user.role !== ROLES.ADMIN) throw ApiError.notFound();
}

async function requireOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, status: true, currency: true },
  });
  if (!order) throw ApiError.notFound();
  return order;
}

/** Admin creates a charge. One PENDING payment per (order, type) at a time. */
export async function createOrderPayment(user: ApiUser, orderId: string, input: CreatePaymentInput) {
  await requireAdmin(user);
  const order = await requireOrder(orderId);

  const pending = await prisma.payment.findFirst({
    where: { orderId, type: input.type, status: PAYMENT_STATUSES.PENDING },
    select: { id: true },
  });
  if (pending) {
    throw ApiError.conflict(
      `An ${PAYMENT_TYPE_LABELS[input.type].toLowerCase()} is already awaiting payment. Verify or reject it first.`,
    );
  }

  const label = PAYMENT_TYPE_LABELS[input.type as PaymentType];
  const eventNote = `Charge created: ${label} — ${formatMoney(input.amount, order.currency)}`;

  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.payment.create({
      data: {
        orderId,
        type: input.type,
        amount: input.amount,
        // Manual flow only for now; CARD/OTHER arrive with a real gateway.
        method: PAYMENT_METHODS.BANK_TRANSFER,
        note: input.note ?? null,
      },
      select: paymentSelect,
    });

    // Same-status event: the timeline renders it as a note, not a transition.
    await tx.orderEvent.create({
      data: {
        orderId,
        actorId: user.id,
        fromStatus: order.status,
        toStatus: order.status,
        note: input.note ? `${eventNote} · ${input.note}` : eventNote,
      },
    });

    return created;
  });

  void publishUserEvent(order.userId, {
    type: REALTIME_EVENTS.paymentCreated,
    refId: orderId,
  });

  return payment;
}

/** Payments of one order. Clients: own order only (stranger → 404). */
export async function listPaymentsForOrder(user: ApiUser, orderId: string) {
  const order = await requireOrder(orderId);
  if (user.role !== ROLES.ADMIN && order.userId !== user.id) throw ApiError.notFound();

  return prisma.payment.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
    select: paymentSelect,
  });
}

/**
 * Client attaches their transfer proof to their own pending payment.
 * The file must be a confirmed PAYMENT_PROOF upload by them on this order.
 */
export async function attachPaymentProof(user: ApiUser, paymentId: string, input: PaymentProofInput) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, orderId: true, status: true, proofFileId: true, order: { select: { userId: true } } },
  });
  // Client: stranger or missing both404; admin: any.
  if (!payment || (user.role !== ROLES.ADMIN && payment.order.userId !== user.id)) {
    throw ApiError.notFound();
  }
  if (payment.status !== PAYMENT_STATUSES.PENDING) {
    throw ApiError.badRequest("This payment is no longer awaiting a proof.");
  }
  if (payment.proofFileId) {
    throw ApiError.badRequest("A proof is already attached. The designer will review it shortly.");
  }

  const file = await prisma.orderFile.findUnique({
    where: { id: input.fileId },
    select: { id: true, uploadedById: true, orderId: true, kind: true, confirmedAt: true },
  });
  if (
    !file ||
    file.uploadedById !== user.id ||
    file.orderId !== payment.orderId ||
    file.kind !== "PAYMENT_PROOF" ||
    !file.confirmedAt
  ) {
    throw ApiError.badRequest("That file can't be used as a proof. Please upload it again.");
  }

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { proofFileId: file.id },
    select: paymentSelect,
  });

  void publishAdminsEvent({
    type: REALTIME_EVENTS.paymentUpdated,
    refId: payment.orderId,
  });

  return updated;
}

/**
 * Admin verifies or rejects. A verified FINAL payment unlocks the locked
 * final files (`order.finalPaymentVerified`); the order status never moves
 * on its own — the admin does that from the proceed page.
 */
export async function verifyPayment(user: ApiUser, paymentId: string, input: VerifyPaymentInput) {
  await requireAdmin(user);

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      orderId: true,
      type: true,
      amount: true,
      status: true,
      order: { select: { status: true, userId: true, currency: true } },
    },
  });
  if (!payment) throw ApiError.notFound();
  if (payment.status !== PAYMENT_STATUSES.PENDING) {
    throw ApiError.badRequest("This payment was already decided.");
  }

  const label = PAYMENT_TYPE_LABELS[payment.type as PaymentType];
  const eventNote =
    input.status === PAYMENT_STATUSES.PAID
      ? `Payment verified: ${label} — ${formatMoney(payment.amount, payment.order.currency)}`
      : `Payment rejected: ${label} — ${formatMoney(payment.amount, payment.order.currency)}${input.note ? ` · ${input.note}` : ""}`;

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: input.status,
        verifiedById: user.id,
        ...(input.note ? { note: input.note } : {}),
      },
      select: paymentSelect,
    });

    // Verified final payment unlocks FINAL downloads (mirrors the 402 gate).
    if (input.status === PAYMENT_STATUSES.PAID && payment.type === "FINAL") {
      await tx.order.update({
        where: { id: payment.orderId },
        data: { finalPaymentVerified: true },
        select: { id: true },
      });
    }

    await tx.orderEvent.create({
      data: {
        orderId: payment.orderId,
        actorId: user.id,
        fromStatus: payment.order.status,
        toStatus: payment.order.status,
        note: eventNote,
      },
    });

    return result;
  });

  void publishUserEvent(payment.order.userId, {
    type: REALTIME_EVENTS.paymentUpdated,
    refId: payment.orderId,
  });

  return updated;
}
