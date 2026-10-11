import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/db", () => {
  const prisma = {
    order: { findUnique: vi.fn(), update: vi.fn() },
    payment: { create: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    orderFile: { findUnique: vi.fn() },
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

import { attachPaymentProof, createOrderPayment, listPaymentsForOrder, verifyPayment } from "./payments";

const orderFindUnique = prisma.order.findUnique as unknown as Mock;
const paymentCreate = prisma.payment.create as unknown as Mock;
const paymentFindFirst = prisma.payment.findFirst as unknown as Mock;
const paymentFindUnique = prisma.payment.findUnique as unknown as Mock;
const paymentFindMany = prisma.payment.findMany as unknown as Mock;
const paymentUpdate = prisma.payment.update as unknown as Mock;
const orderUpdate = prisma.order.update as unknown as Mock;
const orderFileFindUnique = prisma.orderFile.findUnique as unknown as Mock;
const orderEventCreate = prisma.orderEvent.create as unknown as Mock;
const publishUser = publishUserEvent as unknown as Mock;
const publishAdmins = publishAdminsEvent as unknown as Mock;

const client: ApiUser = { id: "usr_client", email: "c@test.dev", role: ROLES.CLIENT };
const admin: ApiUser = { id: "usr_admin", email: "a@test.dev", role: ROLES.ADMIN };
const stranger: ApiUser = { id: "usr_other", email: "o@test.dev", role: ROLES.CLIENT };

beforeEach(() => {
  vi.clearAllMocks();
  orderFindUnique.mockResolvedValue({ id: "ord_1", userId: "usr_client", status: "AWAITING_ADVANCE" });
  paymentCreate.mockResolvedValue({ id: "pay_1" });
  paymentFindFirst.mockResolvedValue(null);
  paymentFindMany.mockResolvedValue([]);
  paymentUpdate.mockResolvedValue({});
  orderUpdate.mockResolvedValue({ id: "ord_1" });
  orderFileFindUnique.mockResolvedValue(null);
});

describe("createOrderPayment", () => {
  it("creates a pending charge and writes a same-status timeline note", async () => {
    const payment = await createOrderPayment(admin, "ord_1", {
      amount: 250_000,
      type: "ADVANCE",
      note: "Pay at branch X",
    });

    expect(payment).toEqual({ id: "pay_1" });
    expect(paymentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: "ord_1",
          type: "ADVANCE",
          amount: 250_000,
          method: "BANK_TRANSFER",
          note: "Pay at branch X",
        }),
      }),
    );
    expect(orderEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: "ord_1",
        actorId: admin.id,
        fromStatus: "AWAITING_ADVANCE",
        toStatus: "AWAITING_ADVANCE",
        note: expect.stringContaining("Advance payment"),
      }),
    });
    expect(publishUser).toHaveBeenCalledWith("usr_client", {
      type: "payment.created",
      refId: "ord_1",
    });
  });

  it("rejects a second pending charge of the same type (409)", async () => {
    paymentFindFirst.mockResolvedValueOnce({ id: "pay_existing" });

    await expect(
      createOrderPayment(admin, "ord_1", { amount: 100, type: "ADVANCE" }),
    ).rejects.toMatchObject({ status: 409 });
    expect(paymentCreate).not.toHaveBeenCalled();
  });

  it("non-admins get 404 (existence never leaks)", async () => {
    await expect(
      createOrderPayment(client, "ord_1", { amount: 100, type: "ADVANCE" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("404s on a missing order", async () => {
    orderFindUnique.mockResolvedValueOnce(null);
    await expect(
      createOrderPayment(admin, "ord_missing", { amount: 100, type: "ADVANCE" }),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe("listPaymentsForOrder", () => {
  it("the order's client may list their payments", async () => {
    await listPaymentsForOrder(client, "ord_1");
    expect(paymentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { orderId: "ord_1" } }),
    );
  });

  it("a stranger gets 404", async () => {
    await expect(listPaymentsForOrder(stranger, "ord_1")).rejects.toMatchObject({ status: 404 });
  });
});

describe("attachPaymentProof", () => {
  const pendingPayment = {
    id: "pay_1",
    orderId: "ord_1",
    status: "PENDING",
    proofFileId: null,
    order: { userId: "usr_client" },
  };

  it("binds a confirmed own PAYMENT_PROOF file and pings the admins", async () => {
    paymentFindUnique.mockResolvedValueOnce(pendingPayment);
    orderFileFindUnique.mockResolvedValueOnce({
      id: "file_1",
      uploadedById: client.id,
      orderId: "ord_1",
      kind: "PAYMENT_PROOF",
      confirmedAt: new Date(),
    });

    await attachPaymentProof(client, "pay_1", { fileId: "file_1" });

    expect(paymentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "pay_1" },
        data: { proofFileId: "file_1" },
      }),
    );
    expect(publishAdmins).toHaveBeenCalledWith({ type: "payment.updated", refId: "ord_1" });
  });

  it("rejects foreign, unconfirmed or wrong-kind files (400)", async () => {
    paymentFindUnique.mockResolvedValue(pendingPayment);
    orderFileFindUnique.mockResolvedValue({
      id: "file_1",
      uploadedById: stranger.id, // not the client's file
      orderId: "ord_1",
      kind: "PAYMENT_PROOF",
      confirmedAt: new Date(),
    });

    await expect(attachPaymentProof(client, "pay_1", { fileId: "file_1" })).rejects.toMatchObject({
      status: 400,
    });
    expect(paymentUpdate).not.toHaveBeenCalled();
  });

  it("the other client's payment 404s", async () => {
    paymentFindUnique.mockResolvedValueOnce(pendingPayment);
    await expect(attachPaymentProof(stranger, "pay_1", { fileId: "file_1" })).rejects.toMatchObject({
      status: 404,
    });
  });

  it("refuses a second proof once one is attached", async () => {
    paymentFindUnique.mockResolvedValueOnce({ ...pendingPayment, proofFileId: "file_old" });
    await expect(attachPaymentProof(client, "pay_1", { fileId: "file_1" })).rejects.toMatchObject({
      status: 400,
    });
  });
});

describe("verifyPayment", () => {
  const pendingFinal = {
    id: "pay_1",
    orderId: "ord_1",
    type: "FINAL",
    amount: 500_000,
    status: "PENDING",
    order: { status: "AWAITING_FINAL_PAYMENT", userId: "usr_client" },
  };

  it("verifying a FINAL payment unlocks order.finalPaymentVerified", async () => {
    paymentFindUnique.mockResolvedValueOnce(pendingFinal);
    paymentUpdate.mockResolvedValueOnce({ id: "pay_1", status: "PAID" });

    await verifyPayment(admin, "pay_1", { status: "PAID" });

    expect(orderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "ord_1" },
        data: { finalPaymentVerified: true },
      }),
    );
    expect(paymentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "PAID", verifiedById: admin.id }),
      }),
    );
    expect(publishUser).toHaveBeenCalledWith("usr_client", {
      type: "payment.updated",
      refId: "ord_1",
    });
  });

  it("rejecting does not unlock final files", async () => {
    paymentFindUnique.mockResolvedValueOnce(pendingFinal);

    await verifyPayment(admin, "pay_1", { status: "REJECTED" });

    expect(orderUpdate).not.toHaveBeenCalled();
  });

  it("an already-decided payment cannot be decided twice (400)", async () => {
    paymentFindUnique.mockResolvedValueOnce({ ...pendingFinal, status: "PAID" });
    await expect(verifyPayment(admin, "pay_1", { status: "PAID" })).rejects.toMatchObject({
      status: 400,
    });
  });

  it("non-admins get 404", async () => {
    await expect(verifyPayment(client, "pay_1", { status: "PAID" })).rejects.toMatchObject({
      status: 404,
    });
  });
});
