import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/db", () => {
  const prisma = {
    package: { findFirst: vi.fn() },
    orderFile: { findMany: vi.fn() },
    order: { count: vi.fn(), create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
    orderEvent: { create: vi.fn() },
    payment: { findMany: vi.fn() },
    revision: { findMany: vi.fn() },
    // Prisma's $transaction takes a callback or an array of already-started
    // promises; listOrdersForUser uses the array form.
    $transaction: vi.fn(async (fn: unknown) =>
      typeof fn === "function" ? fn(prisma) : Promise.all(fn as Promise<unknown>[]),
    ),
  };
  return { prisma };
});

// createOrder snapshots the live site currency (plan 3); next/cache stays out
// of the test graph.
vi.mock("@/lib/settings", () => ({
  getSiteSettings: vi.fn(async () => ({ currency: "PKR" })),
}));

import { prisma } from "@/lib/db";
import { FILE_KINDS, ORDER_STATUSES, PAGINATION, ROLES } from "@/config/constants";
import type { ApiUser } from "@/lib/api/types";
import type { OrderInput } from "@/lib/validators/order";

import { createOrder, generateOrderNumber, getOrderForUser, listOrdersForUser } from "./orders";

const orderFindMany = prisma.order.findMany as unknown as Mock;
const orderFindUnique = prisma.order.findUnique as unknown as Mock;
const paymentFindMany = prisma.payment.findMany as unknown as Mock;

const packageFindFirst = prisma.package.findFirst as unknown as Mock;
const orderFileFindMany = prisma.orderFile.findMany as unknown as Mock;
const orderCount = prisma.order.count as unknown as Mock;
const orderCreate = prisma.order.create as unknown as Mock;
const orderEventCreate = prisma.orderEvent.create as unknown as Mock;

const user: ApiUser = { id: "usr_client_1", email: "client@test.dev", role: ROLES.CLIENT };

const input: OrderInput = {
  packageId: "pkg_seed_1",
  plot: {
    width: 40,
    length: 80,
    unit: "FT",
    facing: "NORTH",
    roadSides: ["FRONT", "LEFT"],
    city: "Lahore",
  },
  requirements: {
    floors: 2,
    bedrooms: 4,
    bathrooms: 3,
    kitchenType: "OPEN",
    garage: true,
    lounge: true,
    extras: "Prayer room",
  },
  style: "MODERN",
  budget: 5_000_000,
  notes: "Corner preference",
  fileIds: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  packageFindFirst.mockResolvedValue({ id: input.packageId });
  orderCount.mockResolvedValue(0);
  orderFileFindMany.mockResolvedValue([]);
  orderCreate.mockResolvedValue({
    id: "ord_1",
    number: "AP-2026-0001",
    status: ORDER_STATUSES.SUBMITTED,
  });
  orderEventCreate.mockResolvedValue({ id: "evt_1" });
  orderFindMany.mockResolvedValue([]);
  orderFindUnique.mockResolvedValue(null);
  paymentFindMany.mockResolvedValue([]);
});

describe("generateOrderNumber", () => {
  it("pads the yearly sequence to four digits", () => {
    expect(generateOrderNumber(new Date("2026-03-04T10:00:00Z"), 7)).toBe("AP-2026-0007");
  });
});

describe("createOrder", () => {
  it("rejects admins with 403 before touching the database (plan Phase A2)", async () => {
    const admin: ApiUser = { id: "usr_admin", email: "admin@test.dev", role: ROLES.ADMIN };

    await expect(createOrder(admin, input)).rejects.toMatchObject({ status: 403 });
    expect(packageFindFirst).not.toHaveBeenCalled();
    expect(orderCreate).not.toHaveBeenCalled();
  });

  it("creates the order and its initial SUBMITTED event atomically", async () => {
    const order = await createOrder(user, input);

    expect(order).toMatchObject({ id: "ord_1", status: ORDER_STATUSES.SUBMITTED });
    expect(orderEventCreate).toHaveBeenCalledTimes(1);
    expect(orderEventCreate).toHaveBeenCalledWith({
      data: {
        orderId: "ord_1",
        actorId: user.id,
        fromStatus: null,
        toStatus: ORDER_STATUSES.SUBMITTED,
      },
    });
  });

  it("snapshots the live site currency onto the order (plan 3)", async () => {
    const { getSiteSettings } = await import("@/lib/settings");
    (getSiteSettings as unknown as Mock).mockResolvedValueOnce({ currency: "USD" });

    await createOrder(user, input);

    expect(orderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ currency: "USD" }),
      }),
    );
  });

  it("rejects an unknown or inactive package before writing anything", async () => {
    packageFindFirst.mockResolvedValue(null);

    await expect(createOrder(user, input)).rejects.toMatchObject({ status: 400 });

    expect(orderCreate).not.toHaveBeenCalled();
    expect(orderEventCreate).not.toHaveBeenCalled();
  });

  it("only connects files that survived the ownership lookup", async () => {
    // The service filters fileIds by uploadedById; only owned rows come back.
    orderFileFindMany.mockResolvedValue([{ id: "file_owned" }]);

    await createOrder(user, { ...input, fileIds: ["file_owned", "file_foreign"] });

    expect(orderFileFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ uploadedById: user.id }),
      }),
    );
    expect(orderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          files: { connect: [{ id: "file_owned" }] },
        }),
      }),
    );
  });

  it("derives the yearly number from the count inside the transaction", async () => {
    orderCount.mockResolvedValue(6);

    await createOrder(user, input);

    expect(orderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ number: "AP-2026-0007" }),
      }),
    );
  });
});

describe("listOrdersForUser", () => {
  const query = { page: 1, pageSize: PAGINATION.defaultPageSize, sort: "newest" } as const;

  it("refuses admins — they have their own orders view", async () => {
    const admin: ApiUser = { id: "usr_admin", email: "admin@test.dev", role: ROLES.ADMIN };

    await expect(listOrdersForUser(admin, { ...query })).rejects.toMatchObject({ status: 403 });
    expect(orderFindMany).not.toHaveBeenCalled();
  });

  it("always scopes to the caller's own orders", async () => {
    await listOrdersForUser(user, { ...query });

    expect(orderFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: user.id }) }),
    );
  });

  it("combines status filter, free-text search and paging", async () => {
    orderCount.mockResolvedValue(41);

    const result = await listOrdersForUser(user, {
      ...query,
      page: 3,
      status: ORDER_STATUSES.IN_DESIGN,
      q: "Lahore",
      sort: "oldest",
    });

    expect(orderFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: user.id,
          status: ORDER_STATUSES.IN_DESIGN,
          OR: expect.any(Array),
        }),
        orderBy: { createdAt: "asc" },
        skip: 2 * PAGINATION.defaultPageSize,
        take: PAGINATION.defaultPageSize,
      }),
    );
    expect(result.meta).toEqual({
      page: 3,
      pageSize: PAGINATION.defaultPageSize,
      total: 41,
    });
  });

  it("returns newest-first items with money fields by default", async () => {
    orderFindMany.mockResolvedValue([
      { id: "ord_2", number: "AP-2026-0002", status: ORDER_STATUSES.IN_DESIGN, currency: "PKR" },
    ]);
    orderCount.mockResolvedValue(1);

    const result = await listOrdersForUser(user, { ...query });

    expect(orderFindMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { createdAt: "desc" } }));
    expect(result.items[0]).toMatchObject({ id: "ord_2", currency: "PKR" });
    expect(result.meta).toEqual({ page: 1, pageSize: PAGINATION.defaultPageSize, total: 1 });
  });
});

describe("getOrderForUser", () => {
  const orderRow = {
    id: "ord_1",
    userId: user.id,
    status: ORDER_STATUSES.AWAITING_FINAL_PAYMENT,
    finalPaymentVerified: false,
    revisions: [
      { id: "rev_1", number: 1, extraFeeRequired: true, files: [] },
      { id: "rev_2", number: 2, extraFeeRequired: false, files: [] },
    ],
  };

  it("hides everything but the client's own order (404)", async () => {
    orderFindUnique.mockResolvedValue({ ...orderRow, userId: "usr_other" });

    await expect(getOrderForUser(user, "ord_1")).rejects.toMatchObject({ status: 404 });
    expect(orderFileFindMany).not.toHaveBeenCalled();
  });

  it("locks finals until the final payment is verified", async () => {
    orderFindUnique.mockResolvedValue({ ...orderRow, revisions: [] });

    await getOrderForUser(user, "ord_1");

    expect(orderFileFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          kind: { in: [FILE_KINDS.CLIENT, FILE_KINDS.DRAFT_PREVIEW, FILE_KINDS.REVISION_REF] },
        }),
      }),
    );
  });

  it("serves finals once the final payment is verified", async () => {
    orderFindUnique.mockResolvedValue({ ...orderRow, revisions: [], finalPaymentVerified: true });

    await getOrderForUser(user, "ord_1");

    const call = orderFileFindMany.mock.calls[0]?.[0] as { where: { kind: { in: string[] } } };
    expect(call.where.kind.in).toContain(FILE_KINDS.FINAL);
  });

  it("marks over-limit revisions paid only after an EXTRA_REVISION charge is PAID", async () => {
    orderFindUnique.mockResolvedValue(orderRow);

    paymentFindMany.mockResolvedValue([{ status: "PAID" }]);
    const paid = await getOrderForUser(user, "ord_1");
    expect(paid.revisions).toEqual([
      expect.objectContaining({ id: "rev_1", extraFeePaid: true }),
      expect.objectContaining({ id: "rev_2", extraFeePaid: false }),
    ]);

    paymentFindMany.mockResolvedValue([{ status: "PENDING" }]);
    const unpaid = await getOrderForUser(user, "ord_1");
    expect(unpaid.revisions[0]).toMatchObject({ extraFeePaid: false });
  });
});
