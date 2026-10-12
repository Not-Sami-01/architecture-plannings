import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/db", () => {
  const prisma = {
    order: { findUnique: vi.fn(), update: vi.fn() },
    orderFile: { findMany: vi.fn() },
    revision: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), aggregate: vi.fn() },
    payment: { findFirst: vi.fn(), findMany: vi.fn() },
    orderEvent: { create: vi.fn() },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma)),
  };
  return { prisma };
});

vi.mock("@/lib/realtime", () => ({
  publishUserEvent: vi.fn(async () => undefined),
  publishAdminsEvent: vi.fn(async () => undefined),
}));

import { prisma } from "@/lib/db";
import { publishAdminsEvent, publishUserEvent } from "@/lib/realtime";
import { ROLES } from "@/config/constants";
import type { ApiUser } from "@/lib/api/types";

import { acceptRevision, listRevisions, requestRevision } from "./revisions";

const orderFindUnique = prisma.order.findUnique as unknown as Mock;
const orderUpdate = prisma.order.update as unknown as Mock;
const orderFileFindMany = prisma.orderFile.findMany as unknown as Mock;
const revisionAggregate = prisma.revision.aggregate as unknown as Mock;
const revisionCreate = prisma.revision.create as unknown as Mock;
const revisionFindUnique = prisma.revision.findUnique as unknown as Mock;
const revisionFindMany = prisma.revision.findMany as unknown as Mock;
const revisionUpdate = prisma.revision.update as unknown as Mock;
const paymentFindFirst = prisma.payment.findFirst as unknown as Mock;
const paymentFindMany = prisma.payment.findMany as unknown as Mock;
const orderEventCreate = prisma.orderEvent.create as unknown as Mock;
const publishUser = publishUserEvent as unknown as Mock;
const publishAdmins = publishAdminsEvent as unknown as Mock;

const admin: ApiUser = { id: "usr_admin", email: "a@test.dev", role: ROLES.ADMIN };
const client: ApiUser = { id: "usr_client", email: "c@test.dev", role: ROLES.CLIENT };
const stranger: ApiUser = { id: "usr_other", email: "o@test.dev", role: ROLES.CLIENT };

const draftDeliveredOrder = {
  id: "ord_1",
  userId: "usr_client",
  status: "DRAFT_DELIVERED",
  revisionCount: 0,
  currency: "PKR",
  package: { revisionLimit: 2 },
};

beforeEach(() => {
  vi.clearAllMocks();
  orderFindUnique.mockResolvedValue(draftDeliveredOrder);
  orderUpdate.mockResolvedValue({ id: "ord_1" });
  orderFileFindMany.mockResolvedValue([]);
  revisionAggregate.mockResolvedValue({ _max: { number: null } });
  revisionCreate.mockResolvedValue({ id: "rev_1", number: 1, status: "OPEN", extraFeeRequired: false });
  revisionFindMany.mockResolvedValue([]);
  paymentFindMany.mockResolvedValue([]);
  orderEventCreate.mockResolvedValue({ id: "evt_1" });
});

describe("requestRevision", () => {
  it("404s for a stranger's order", async () => {
    await expect(
      requestRevision(stranger, "ord_1", { message: "Wider windows" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("refuses admins filing a client-side revision (403)", async () => {
    await expect(
      requestRevision(admin, "ord_1", { message: "nope" }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("refuses when the order is not DRAFT_DELIVERED (409)", async () => {
    orderFindUnique.mockResolvedValue({ ...draftDeliveredOrder, status: "IN_DESIGN" });
    await expect(
      requestRevision(client, "ord_1", { message: "x" }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("creates the revision, bumps revisionCount, and moves to REVISION_REQUESTED", async () => {
    const result = await requestRevision(client, "ord_1", { message: "Move the kitchen" });

    expect(result).toEqual({ id: "rev_1", number: 1, status: "OPEN", extraFeeRequired: false });
    expect(revisionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: "ord_1",
          number: 1,
          message: "Move the kitchen",
          extraFeeRequired: false,
        }),
      }),
    );
    expect(orderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { revisionCount: { increment: 1 } },
      }),
    );
    expect(orderEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ toStatus: "REVISION_REQUESTED" }),
      }),
    );
    expect(publishAdmins).toHaveBeenCalledWith({
      type: "revision.requested",
      refId: "ord_1",
    });
  });

  it("marks extraFeeRequired when free revisions are used up", async () => {
    orderFindUnique.mockResolvedValue({
      ...draftDeliveredOrder,
      revisionCount: 2,
      package: { revisionLimit: 2 },
    });
    revisionCreate.mockResolvedValue({ id: "rev_3", number: 3, status: "OPEN", extraFeeRequired: true });

    const result = await requestRevision(client, "ord_1", { message: "One more tweak" });

    expect(result.extraFeeRequired).toBe(true);
    expect(revisionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ extraFeeRequired: true }),
      }),
    );
  });

  it("rejects unconfirmed or foreign reference files (400)", async () => {
    orderFileFindMany.mockResolvedValue([
      { id: "f1", kind: "REVISION_REF", confirmedAt: new Date(), uploadedById: "usr_client" },
    ]);

    await expect(
      requestRevision(client, "ord_1", { message: "See attached", fileIds: ["f2"] }),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe("acceptRevision", () => {
  const openRevision = {
    id: "rev_1",
    number: 1,
    status: "OPEN",
    extraFeeRequired: false,
    order: { id: "ord_1", userId: "usr_client", status: "REVISION_REQUESTED" },
  };

  it("404s for non-admins", async () => {
    await expect(acceptRevision(client, "rev_1")).rejects.toMatchObject({ status: 404 });
  });

  it("404s when the revision does not exist", async () => {
    revisionFindUnique.mockResolvedValue(null);
    await expect(acceptRevision(admin, "rev_1")).rejects.toMatchObject({ status: 404 });
  });

  it("refuses already-handled revisions (409)", async () => {
    revisionFindUnique.mockResolvedValue({ ...openRevision, status: "DONE" });
    await expect(acceptRevision(admin, "rev_1")).rejects.toMatchObject({ status: 409 });
  });

  it("blocks extra-fee revisions until the charge is PAID (409)", async () => {
    revisionFindUnique.mockResolvedValue({ ...openRevision, extraFeeRequired: true });
    paymentFindFirst.mockResolvedValue(null);

    await expect(acceptRevision(admin, "rev_1")).rejects.toMatchObject({
      status: 409,
      details: { paymentStatus: "PENDING" },
    });
  });

  it("accepts a paid extra-fee revision", async () => {
    revisionFindUnique.mockResolvedValue({ ...openRevision, extraFeeRequired: true });
    paymentFindFirst.mockResolvedValue({ id: "pay_1" });
    orderUpdate.mockResolvedValue({ id: "ord_1", status: "IN_DESIGN" });

    const result = await acceptRevision(admin, "rev_1");

    expect(result).toMatchObject({ id: "ord_1", status: "IN_DESIGN", revisionId: "rev_1" });
    expect(revisionUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "DONE", acceptedById: admin.id }),
      }),
    );
    expect(publishUser).toHaveBeenCalledWith("usr_client", {
      type: "revision.accepted",
      refId: "ord_1",
    });
  });

  it("moves REVISION_REQUESTED → IN_DESIGN for a free revision", async () => {
    orderUpdate.mockResolvedValue({ id: "ord_1", status: "IN_DESIGN" });

    const result = await acceptRevision(admin, "rev_1");

    expect(result).toMatchObject({ status: "IN_DESIGN", revisionId: "rev_1", number: 1 });
    expect(orderEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ fromStatus: "REVISION_REQUESTED", toStatus: "IN_DESIGN" }),
      }),
    );
  });
});

describe("listRevisions", () => {
  it("404s for strangers", async () => {
    orderFindUnique.mockResolvedValue(draftDeliveredOrder);
    await expect(listRevisions(stranger, "ord_1")).rejects.toMatchObject({ status: 404 });
  });

  it("includes files and the order-level extraFeePaid flag", async () => {
    revisionFindMany.mockResolvedValue([
      {
        id: "rev_1",
        number: 1,
        status: "OPEN",
        message: "tweak",
        extraFeeRequired: true,
        acceptedAt: null,
        createdAt: new Date(),
        files: [],
      },
    ]);
    paymentFindMany.mockResolvedValue([{ status: "PAID" }]);

    const revisions = await listRevisions(admin, "ord_1");

    expect(revisions).toHaveLength(1);
    expect(revisions[0]).toMatchObject({ extraFeePaid: true });
  });

  it("reports extraFeePaid=false while the extra charge is unpaid", async () => {
    revisionFindMany.mockResolvedValue([
      {
        id: "rev_1",
        number: 1,
        status: "OPEN",
        message: "tweak",
        extraFeeRequired: true,
        acceptedAt: null,
        createdAt: new Date(),
        files: [],
      },
    ]);
    paymentFindMany.mockResolvedValue([{ status: "PENDING" }]);

    const revisions = await listRevisions(admin, "ord_1");

    expect(revisions[0]).toMatchObject({ extraFeePaid: false });
  });
});
