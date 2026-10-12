import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/response";
import {
  FILE_KINDS,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_TYPES,
  REALTIME_EVENTS,
  REVISION_STATUSES,
  ROLES,
} from "@/config/constants";
import type { ApiUser } from "@/lib/api/types";
import { applyStatusChange } from "@/lib/orders/status";
import { publishAdminsEvent, publishUserEvent } from "@/lib/realtime";
import type { RevisionRequestInput } from "@/lib/validators/revisions";

/** Revision workflow (plan 3 P4; PRD FR-19–FR-21). */

async function requireOrderAccess(user: ApiUser, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      status: true,
      revisionCount: true,
      currency: true,
      package: { select: { revisionLimit: true } },
    },
  });
  const canSee = order && (user.role === ROLES.ADMIN || order.userId === user.id);
  if (!order || !canSee) throw ApiError.notFound();
  return order;
}

/**
 * Client asks for a revision (plan 3 P4). The request is always accepted
 * from DRAFT_DELIVERED — when the package's free revisions are used up it is
 * recorded with `extraFeeRequired` and the designer quotes an EXTRA_REVISION
 * charge before accepting (PRD FR-21, plan decision 1).
 */
export async function requestRevision(user: ApiUser, orderId: string, input: RevisionRequestInput) {
  const order = await requireOrderAccess(user, orderId);

  if (order.userId !== user.id) {
    // Admins see the thread but never file revision requests themselves.
    throw ApiError.forbidden("Only the client can request a revision.");
  }

  // The machine only allows REVISION_REQUESTED from DRAFT_DELIVERED.
  if (order.status !== ORDER_STATUSES.DRAFT_DELIVERED) {
    throw ApiError.invalidTransition(
      "Revisions can only be requested while a draft is awaiting your approval.",
    );
  }

  const fileIds = input.fileIds ?? [];
  if (fileIds.length > 0) {
    const files = await prisma.orderFile.findMany({
      where: { id: { in: fileIds }, orderId: order.id },
      select: { id: true, kind: true, confirmedAt: true, uploadedById: true },
    });
    const byId = new Map(files.map((f) => [f.id, f]));
    for (const fileId of fileIds) {
      const file = byId.get(fileId);
      if (
        !file ||
        !file.confirmedAt ||
        file.kind !== FILE_KINDS.REVISION_REF ||
        file.uploadedById !== user.id
      ) {
        throw ApiError.badRequest("One of those reference files is not ready. Try re-uploading.");
      }
    }
  }

  const extraFeeRequired = order.revisionCount >= order.package.revisionLimit;

  const created = await prisma.$transaction(async (tx) => {
    const latest = await tx.revision.aggregate({
      where: { orderId: order.id },
      _max: { number: true },
    });

    const revision = await tx.revision.create({
      data: {
        orderId: order.id,
        number: (latest._max.number ?? 0) + 1,
        message: input.message,
        extraFeeRequired,
        files: fileIds.length ? { connect: fileIds.map((id) => ({ id })) } : undefined,
      },
      select: { id: true, number: true, status: true, extraFeeRequired: true },
    });

    // Order must know how many revisions were asked for (limit math next time)
    // and the timeline must show the transition the client just caused.
    await tx.order.update({
      where: { id: order.id },
      data: { revisionCount: { increment: 1 } },
      select: { id: true },
    });

    await applyStatusChange(tx, {
      orderId: order.id,
      actorId: user.id,
      from: order.status,
      to: ORDER_STATUSES.REVISION_REQUESTED,
      note: `Revision #${revision.number} requested`,
    });

    return revision;
  });

  void publishAdminsEvent({
    type: REALTIME_EVENTS.revisionRequested,
    refId: order.id,
  });

  return created;
}

/**
 * Admin accepts a revision request: REVISION_REQUESTED → IN_DESIGN. An
 * extra-fee revision stays blocked until its EXTRA_REVISION payment is PAID
 * (409 with the payment status so the UI can offer the charge dialog).
 */
export async function acceptRevision(user: ApiUser, revisionId: string) {
  if (user.role !== ROLES.ADMIN) throw ApiError.notFound();

  const revision = await prisma.revision.findUnique({
    where: { id: revisionId },
    select: {
      id: true,
      number: true,
      status: true,
      extraFeeRequired: true,
      order: { select: { id: true, userId: true, status: true } },
    },
  });
  if (!revision) throw ApiError.notFound();

  if (revision.status !== REVISION_STATUSES.OPEN) {
    throw ApiError.conflict("This revision was already handled.");
  }

  if (revision.order.status !== ORDER_STATUSES.REVISION_REQUESTED) {
    throw ApiError.invalidTransition(
      "The order is not waiting on a revision right now.",
    );
  }

  if (revision.extraFeeRequired) {
    const payment = await prisma.payment.findFirst({
      where: {
        orderId: revision.order.id,
        type: PAYMENT_TYPES.EXTRA_REVISION,
        status: PAYMENT_STATUSES.PAID,
      },
      select: { id: true },
    });
    if (!payment) {
      throw ApiError.conflict(
        "The extra revision charge must be paid before this can be accepted.",
        { paymentStatus: PAYMENT_STATUSES.PENDING },
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await applyStatusChange(tx, {
      orderId: revision.order.id,
      actorId: user.id,
      from: revision.order.status,
      to: ORDER_STATUSES.IN_DESIGN,
      note: `Revision #${revision.number} accepted`,
    });

    await tx.revision.update({
      where: { id: revision.id },
      data: { status: REVISION_STATUSES.DONE, acceptedAt: new Date(), acceptedById: user.id },
      select: { id: true, status: true },
    });

    return updated;
  });

  void publishUserEvent(revision.order.userId, {
    type: REALTIME_EVENTS.revisionAccepted,
    refId: revision.order.id,
  });
  void publishAdminsEvent({
    type: REALTIME_EVENTS.revisionAccepted,
    refId: revision.order.id,
  });

  return { ...result, revisionId: revision.id, number: revision.number };
}

/** Revisions of an order with their reference files and extra-fee payment state. */
export async function listRevisions(user: ApiUser, orderId: string) {
  await requireOrderAccess(user, orderId);

  const revisions = await prisma.revision.findMany({
    where: { orderId },
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
  });

  // One query for the extra-fee state of the order (the accept button's
  // disabled reason lives here; the charge is per order, not per revision).
  const extraPayments = await prisma.payment.findMany({
    where: { orderId, type: PAYMENT_TYPES.EXTRA_REVISION },
    select: { status: true },
  });
  const extraFeePaid = extraPayments.some((p) => p.status === PAYMENT_STATUSES.PAID);

  return revisions.map((revision) => ({
    ...revision,
    extraFeePaid: revision.extraFeeRequired && extraFeePaid,
  }));
}
