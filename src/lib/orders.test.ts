import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/db", () => {
  const prisma = {
    package: { findFirst: vi.fn() },
    orderFile: { findMany: vi.fn() },
    order: { count: vi.fn(), create: vi.fn() },
    orderEvent: { create: vi.fn() },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma)),
  };
  return { prisma };
});

import { prisma } from "@/lib/db";
import { ORDER_STATUSES, ROLES } from "@/config/constants";
import type { ApiUser } from "@/lib/api/types";
import type { OrderInput } from "@/lib/validators/order";

import { createOrder, generateOrderNumber } from "./orders";

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
});

describe("generateOrderNumber", () => {
  it("pads the yearly sequence to four digits", () => {
    expect(generateOrderNumber(new Date("2026-03-04T10:00:00Z"), 7)).toBe("AP-2026-0007");
  });
});

describe("createOrder", () => {
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
