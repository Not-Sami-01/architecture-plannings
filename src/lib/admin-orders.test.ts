import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/db", () => {
  const prisma = {
    order: { findUnique: vi.fn(), update: vi.fn() },
    orderFile: { findMany: vi.fn() },
    orderEvent: { create: vi.fn() },
    revision: { updateMany: vi.fn() },
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

import { registerDraft, registerFinals } from "./admin-orders";

const orderFindUnique = prisma.order.findUnique as unknown as Mock;
const orderUpdate = prisma.order.update as unknown as Mock;
const orderFileFindMany = prisma.orderFile.findMany as unknown as Mock;
const orderEventCreate = prisma.orderEvent.create as unknown as Mock;
const revisionUpdateMany = prisma.revision.updateMany as unknown as Mock;
const publishUser = publishUserEvent as unknown as Mock;
const publishAdmins = publishAdminsEvent as unknown as Mock;

const admin: ApiUser = { id: "usr_admin", email: "a@test.dev", role: ROLES.ADMIN };
const client: ApiUser = { id: "usr_client", email: "c@test.dev", role: ROLES.CLIENT };

beforeEach(() => {
  vi.clearAllMocks();
  orderFindUnique.mockResolvedValue({ id: "ord_1", status: "IN_DESIGN", userId: "usr_client" });
  orderUpdate.mockResolvedValue({ id: "ord_1", status: "DRAFT_DELIVERED" });
  orderFileFindMany.mockResolvedValue([]);
  revisionUpdateMany.mockResolvedValue({ count: 0 });
});

describe("registerDraft", () => {
  it("refuses non-admins with 404", async () => {
    await expect(
      registerDraft(client, "ord_1", { fileIds: ["f1"] }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("refuses when the order is not IN_DESIGN (409)", async () => {
    orderFindUnique.mockResolvedValue({ id: "ord_1", status: "DRAFT_DELIVERED", userId: "usr_client" });
    await expect(
      registerDraft(admin, "ord_1", { fileIds: ["f1"] }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("rejects files that are missing, unconfirmed, or the wrong kind (400)", async () => {
    orderFileFindMany.mockResolvedValue([
      { id: "f1", filename: "a.pdf", kind: "FINAL", confirmedAt: new Date() },
    ]);
    await expect(
      registerDraft(admin, "ord_1", { fileIds: ["f1"] }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("moves IN_DESIGN → DRAFT_DELIVERED, closes open revisions, and pings", async () => {
    orderFileFindMany.mockResolvedValue([
      { id: "f1", filename: "preview.png", kind: "DRAFT_PREVIEW", confirmedAt: new Date() },
    ]);

    const result = await registerDraft(admin, "ord_1", {
      fileIds: ["f1"],
      note: "First look",
    });

    expect(result).toEqual({ id: "ord_1", status: "DRAFT_DELIVERED" });
    expect(orderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "DRAFT_DELIVERED" } }),
    );
    expect(orderEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fromStatus: "IN_DESIGN",
          toStatus: "DRAFT_DELIVERED",
          note: expect.stringContaining("First look"),
        }),
      }),
    );
    expect(revisionUpdateMany).toHaveBeenCalledWith({
      where: { orderId: "ord_1", status: "OPEN" },
      data: { status: "DONE" },
    });
    expect(publishUser).toHaveBeenCalledWith("usr_client", {
      type: "order.status_changed",
      refId: "ord_1",
    });
    expect(publishAdmins).toHaveBeenCalledWith({
      type: "draft.delivered",
      refId: "ord_1",
    });
  });
});

describe("registerFinals", () => {
  it("refuses non-admins with 404", async () => {
    await expect(
      registerFinals(client, "ord_1", { fileIds: ["f1"] }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("refuses before IN_DESIGN and after CANCELLED (400)", async () => {
    for (const status of ["SUBMITTED", "CANCELLED", "COMPLETED"]) {
      orderFindUnique.mockResolvedValue({ id: "ord_1", status, userId: "usr_client" });
      await expect(
        registerFinals(admin, "ord_1", { fileIds: ["f1"] }),
      ).rejects.toMatchObject({ status: 400 });
    }
  });

  it("rejects non-FINAL files (400)", async () => {
    orderFindUnique.mockResolvedValue({ id: "ord_1", status: "IN_DESIGN", userId: "usr_client" });
    orderFileFindMany.mockResolvedValue([
      { id: "f1", filename: "a.png", kind: "DRAFT_PREVIEW", confirmedAt: new Date() },
    ]);
    await expect(
      registerFinals(admin, "ord_1", { fileIds: ["f1"] }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("writes a same-status timeline note and pings admins without moving status", async () => {
    orderFindUnique.mockResolvedValue({ id: "ord_1", status: "AWAITING_FINAL_PAYMENT", userId: "usr_client" });
    orderFileFindMany.mockResolvedValue([
      { id: "f1", filename: "final.pdf", kind: "FINAL", confirmedAt: new Date() },
    ]);

    const result = await registerFinals(admin, "ord_1", { fileIds: ["f1"] });

    expect(result).toEqual({ orderId: "ord_1", fileCount: 1 });
    expect(orderUpdate).not.toHaveBeenCalled();
    expect(orderEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fromStatus: "AWAITING_FINAL_PAYMENT",
          toStatus: "AWAITING_FINAL_PAYMENT",
          note: expect.stringContaining("Final files registered"),
        }),
      }),
    );
    expect(publishAdmins).toHaveBeenCalledWith({
      type: "finals.registered",
      refId: "ord_1",
    });
  });
});
