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
  revenue: {
    totalPaid: number;
    advancePaid: number;
    finalPaid: number;
    extraRevisionPaid: number;
    thisMonthPaid: number;
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
        select: { type: true, amount: true, createdAt: true },
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
      prisma.revision.groupBy({
        by: [],
        _count: { status: true },
        where: { status: REVISION_STATUSES.DONE },
        orderBy: [],
      }),
    ]);

  const revenue = { totalPaid: 0, advancePaid: 0, finalPaid: 0, extraRevisionPaid: 0, thisMonthPaid: 0 };
  for (const payment of payments) {
    revenue.totalPaid += payment.amount;
    if (payment.type === PAYMENT_TYPES.ADVANCE) revenue.advancePaid += payment.amount;
    if (payment.type === PAYMENT_TYPES.FINAL) revenue.finalPaid += payment.amount;
    if (payment.type === PAYMENT_TYPES.EXTRA_REVISION) revenue.extraRevisionPaid += payment.amount;
    if (payment.createdAt >= monthStart) revenue.thisMonthPaid += payment.amount;
  }

  // NB: currencies are not mixed in revenue math — the site setting is
  // relabel-only, and payments were issued in the currency of their order's
  // snapshot. Display uses the current setting (plan decision 4).
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

  const totalDoneRevisions =
    (revisionAgg[0]?._count as { status?: number } | undefined)?.status ?? 0;

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
