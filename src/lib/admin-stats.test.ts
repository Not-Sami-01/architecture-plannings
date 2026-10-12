import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: (ops: unknown[]) => Promise.all(ops),
    payment: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    order: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    revision: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import { getAdminStats } from "@/lib/admin-stats";
import { ApiError } from "@/lib/api/response";
import { ORDER_STATUSES, PAYMENT_TYPES, REVISION_STATUSES } from "@/config/constants";
import type { ApiUser } from "@/lib/api/types";

const admin: ApiUser = { id: "admin-1", role: "ADMIN" } as ApiUser;
const client: ApiUser = { id: "user-1", role: "CLIENT" } as ApiUser;

function mockBase() {
  vi.mocked(prisma.payment.findMany).mockResolvedValue([
    { type: PAYMENT_TYPES.ADVANCE, amount: 4000, createdAt: new Date("2026-10-05") },
    { type: PAYMENT_TYPES.ADVANCE, amount: 1000, createdAt: new Date("2026-08-05") },
    { type: PAYMENT_TYPES.FINAL, amount: 6000, createdAt: new Date("2026-10-07") },
    { type: PAYMENT_TYPES.EXTRA_REVISION, amount: 2500, createdAt: new Date("2026-10-07") },
  ] as never);
  vi.mocked(prisma.order.groupBy).mockResolvedValue([
    { status: ORDER_STATUSES.SUBMITTED, _count: { status: 2 } },
    { status: ORDER_STATUSES.COMPLETED, _count: { status: 3 } },
    { status: ORDER_STATUSES.REVISION_REQUESTED, _count: { status: 1 } },
  ] as never);
  vi.mocked(prisma.payment.count).mockResolvedValue(2);
  vi.mocked(prisma.revision.count).mockResolvedValue(1);
  vi.mocked(prisma.order.findMany).mockResolvedValue([
    {
      id: "o1",
      number: "AP-2026-0009",
      status: ORDER_STATUSES.SUBMITTED,
      createdAt: new Date("2026-10-07"),
      user: { name: "Sami", email: "sami@example.com" },
      package: { price: 10000 },
      currency: "PKR",
    },
  ] as never);
  vi.mocked(prisma.order.count).mockResolvedValue(3);
  vi.mocked(prisma.revision.groupBy).mockResolvedValue([
    { _count: { status: 4 } },
  ] as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockBase();
});

describe("getAdminStats", () => {
  it("rejects non-admins with 404 (existence not leaked)", async () => {
    await expect(getAdminStats(client)).rejects.toMatchObject({
      status: 404,
    });
  });

  it("aggregates revenue by type and month", async () => {
    const stats = await getAdminStats(admin);
    // ADVANCE 4000+1000, FINAL 6000, EXTRA 2500 — grand total 13500.
    expect(stats.revenue.totalPaid).toBe(13500);
    expect(stats.revenue.advancePaid).toBe(5000);
    expect(stats.revenue.finalPaid).toBe(6000);
    expect(stats.revenue.extraRevisionPaid).toBe(2500);
    // October 2026 only: 4000 + 6000 + 2500 (August's 1000 excluded).
    expect(stats.revenue.thisMonthPaid).toBe(12500);
  });

  it("zero-fills statuses with no orders and fills the funnel", async () => {
    const stats = await getAdminStats(admin);
    expect(stats.statusCounts[ORDER_STATUSES.SUBMITTED]).toBe(2);
    expect(stats.statusCounts[ORDER_STATUSES.COMPLETED]).toBe(3);
    expect(stats.statusCounts[ORDER_STATUSES.CANCELLED]).toBe(0);
    expect(stats.needsAttention.submitted).toBe(2);
    expect(stats.needsAttention.pendingPayments).toBe(2);
    expect(stats.needsAttention.openRevisions).toBe(1);
  });

  it("maps recent orders with client + package + currency", async () => {
    const stats = await getAdminStats(admin);
    expect(stats.recentOrders).toHaveLength(1);
    expect(stats.recentOrders[0]).toMatchObject({
      number: "AP-2026-0009",
      clientEmail: "sami@example.com",
      packagePrice: 10000,
      currency: "PKR",
    });
    expect(typeof stats.recentOrders[0].createdAt).toBe("string");
  });

  it("averages done revisions over completed orders", async () => {
    const stats = await getAdminStats(admin);
    expect(stats.avgRevisionsPerCompletedOrder).toBeCloseTo(4 / 3);
  });

  it("averages zero when there are no completed orders", async () => {
    vi.mocked(prisma.order.count).mockResolvedValue(0);
    const stats = await getAdminStats(admin);
    expect(stats.avgRevisionsPerCompletedOrder).toBe(0);
  });

  it("falls client role inside a service that must never leak stats", async () => {
    await expect(getAdminStats(client)).rejects.toBeInstanceOf(ApiError);
  });

  it("keeps revision done-status filter for open revisions count", async () => {
    await getAdminStats(admin);
    expect(vi.mocked(prisma.revision.count)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: REVISION_STATUSES.OPEN }),
      }),
    );
  });
});
