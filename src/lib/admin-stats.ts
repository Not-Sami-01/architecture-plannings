import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/response";
import { ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_TYPES, ROLES, REVISION_STATUSES } from "@/config/constants";
import type { ApiUser } from "@/lib/api/types";

/**
 * Admin dashboard stats (plan 3 P7). Pure aggregation — no writes — so it is
 * safe to refetch freely; realtime pings invalidate the query key.
 */

export type AdminStats = {
  statusCounts: Record<OrderStatusKey, number>;
  // Per currency: orders snapshot their own currency (plan 3), so sums are
  // never mixed — the UI formats each entry with its own currency code.
  revenue: {
    byCurrency: Record<
      string,
      {
        totalPaid: number;
        advancePaid: number;
        finalPaid: number;
        extraRevisionPaid: number;
        thisMonthPaid: number;
      }
    >;
  };
  needsAttention: {
    submitted: number;
    awaitingAdvance: number;
    inDesign: number;
    draftDelivered: number;
    awaitingFinalPayment: number;
    pendingPayments: number;
    openRevisions: number;
  };
  recentOrders: Array<{
    id: string;
    number: string;
    status: string;
    createdAt: string;
    clientName: string | null;
    clientEmail: string;
    packagePrice: number;
    currency: string;
  }>;
  avgRevisionsPerCompletedOrder: number;
};

type OrderStatusKey =
  (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];

/** Ordered funnel so the UI never has to re-sort statuses. */
const STATUS_ORDER = Object.values(ORDER_STATUSES) as OrderStatusKey[];

export async function getAdminStats(user: ApiUser): Promise<AdminStats> {
  if (user.role !== ROLES.ADMIN) throw ApiError.notFound();

  // Month boundary for "revenue this month" (server clock; the admin panel is
  // single-timezone in practice).
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [payments, statusGroups, pendingPayments, openRevisions, recentOrders, completedCount, revisionAgg] =
    await prisma.$transaction([
      prisma.payment.findMany({
        where: { status: PAYMENT_STATUSES.PAID },
        select: {
          type: true,
          amount: true,
          // @updatedAt bumps when the payment is verified to PAID — the
          // closest thing to a "paid at" (createdAt is the charge row).
          updatedAt: true,
          order: { select: { currency: true } },
        },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { status: true },
        orderBy: { status: "asc" },
      }),
      prisma.payment.count({ where: { status: PAYMENT_STATUSES.PENDING } }),
      prisma.revision.count({
        where: {
          status: REVISION_STATUSES.OPEN,
          order: { status: ORDER_STATUSES.REVISION_REQUESTED },
        },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          number: true,
          status: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
          package: { select: { price: true } },
          currency: true,
        },
      }),
      prisma.order.count({ where: { status: ORDER_STATUSES.COMPLETED } }),
      // NB: groupBy({ by: [] }) is invalid in Prisma 7 and used to 500 the
      // whole transaction (plan 5 B). Count done revisions on completed
      // orders only, so the average is actually scoped.
      prisma.revision.count({
        where: { status: REVISION_STATUSES.DONE, order: { status: ORDER_STATUSES.COMPLETED } },
      }),
    ]);

  const byCurrency: AdminStats["revenue"]["byCurrency"] = {};
  for (const payment of payments) {
    const currency = payment.order.currency;
    const entry = (byCurrency[currency] ??= {
      totalPaid: 0,
      advancePaid: 0,
      finalPaid: 0,
      extraRevisionPaid: 0,
      thisMonthPaid: 0,
    });
    entry.totalPaid += payment.amount;
    if (payment.type === PAYMENT_TYPES.ADVANCE) entry.advancePaid += payment.amount;
    if (payment.type === PAYMENT_TYPES.FINAL) entry.finalPaid += payment.amount;
    if (payment.type === PAYMENT_TYPES.EXTRA_REVISION) entry.extraRevisionPaid += payment.amount;
    if (payment.updatedAt >= monthStart) entry.thisMonthPaid += payment.amount;
  }
  const revenue = { byCurrency };
  const statusCounts = Object.fromEntries(
    STATUS_ORDER.map((status) => [status, 0]),
  ) as Record<OrderStatusKey, number>;
  for (const group of statusGroups) {
    statusCounts[group.status as OrderStatusKey] =
      (group._count as { status?: number } | undefined)?.status ?? 0;
  }

  const funnel = {
    submitted: statusCounts[ORDER_STATUSES.SUBMITTED],
    awaitingAdvance: statusCounts[ORDER_STATUSES.AWAITING_ADVANCE],
    inDesign: statusCounts[ORDER_STATUSES.IN_DESIGN],
    draftDelivered: statusCounts[ORDER_STATUSES.DRAFT_DELIVERED],
    awaitingFinalPayment: statusCounts[ORDER_STATUSES.AWAITING_FINAL_PAYMENT],
    pendingPayments,
    openRevisions,
  };

  const totalDoneRevisions = revisionAgg; // done revisions on completed orders

  return {
    statusCounts,
    revenue,
    needsAttention: funnel,
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      number: order.number,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      clientName: order.user.name,
      clientEmail: order.user.email,
      packagePrice: order.package.price,
      currency: order.currency,
    })),
    avgRevisionsPerCompletedOrder: completedCount > 0 ? totalDoneRevisions / completedCount : 0,
  };
}
