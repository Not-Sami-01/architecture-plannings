import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/db", () => {
  const prisma = {
    order: { findUnique: vi.fn() },
    message: { findMany: vi.fn(), create: vi.fn() },
  };
  return { prisma };
});

vi.mock("@/lib/realtime", () => ({
  publishUserEvent: vi.fn(async () => undefined),
  publishAdminsEvent: vi.fn(async () => undefined),
}));

import { prisma } from "@/lib/db";
import { publishAdminsEvent, publishUserEvent } from "@/lib/realtime";
import { ApiError } from "@/lib/api/response";
import { ROLES } from "@/config/constants";
import type { ApiUser } from "@/lib/api/types";

import { createMessage, listMessages } from "./messages";

const orderFindUnique = prisma.order.findUnique as unknown as Mock;
const messageFindMany = prisma.message.findMany as unknown as Mock;
const messageCreate = prisma.message.create as unknown as Mock;
const publishUser = publishUserEvent as unknown as Mock;
const publishAdmins = publishAdminsEvent as unknown as Mock;

const client: ApiUser = { id: "usr_client", email: "c@test.dev", role: ROLES.CLIENT };
const admin: ApiUser = { id: "usr_admin", email: "a@test.dev", role: ROLES.ADMIN };
const stranger: ApiUser = { id: "usr_other", email: "o@test.dev", role: ROLES.CLIENT };

beforeEach(() => {
  vi.clearAllMocks();
  orderFindUnique.mockResolvedValue({ id: "ord_1", userId: "usr_client" });
  messageFindMany.mockResolvedValue([]);
  messageCreate.mockImplementation(async (args: { data: Record<string, unknown> }) => ({
    id: "msg_1",
    body: args.data.body,
    internal: args.data.internal,
    createdAt: new Date(),
    sender: { id: client.id, name: "Client", role: ROLES.CLIENT },
  }));
});

describe("listMessages", () => {
  it("filters out internal notes for clients", async () => {
    await listMessages(client, "ord_1");
    expect(messageFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { orderId: "ord_1", internal: false } }),
    );
  });

  it("shows internal notes to admins", async () => {
    await listMessages(admin, "ord_1");
    expect(messageFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { orderId: "ord_1" } }),
    );
    const where = (messageFindMany as Mock).mock.calls[0][0].where;
    expect("internal" in where).toBe(false);
  });

  it("returns 404 for another client's thread", async () => {
    orderFindUnique.mockResolvedValue({ id: "ord_1", userId: "usr_client" });
    await expect(listMessages(stranger, "ord_1")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("returns 404 for a missing order", async () => {
    orderFindUnique.mockResolvedValue(null);
    await expect(listMessages(admin, "ord_missing")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("createMessage", () => {
  it("a client message is stored as public and pings the admins", async () => {
    const message = await createMessage(client, "ord_1", { body: "Hi", internal: false });
    expect(message.internal).toBe(false);
    expect(publishAdmins).toHaveBeenCalledWith({ type: "message.created", refId: "ord_1" });
    expect(publishUser).not.toHaveBeenCalled();
  });

  it("an admin message with internal:true is stored as an internal note", async () => {
    messageCreate.mockImplementationOnce(async (args: { data: Record<string, unknown> }) => ({
      id: "msg_2",
      body: args.data.body,
      internal: args.data.internal,
      createdAt: new Date(),
      sender: { id: admin.id, name: "Admin", role: ROLES.ADMIN },
    }));
    const message = await createMessage(admin, "ord_1", { body: "Noted", internal: true });
    expect(message.internal).toBe(true);
    // Internal notes ping the owner's channel so their thread refreshes.
    expect(publishUser).toHaveBeenCalledWith("usr_client", expect.anything());
    expect(publishAdmins).not.toHaveBeenCalled();
  });

  it("rejects internal:true from a client (400, no leak)", async () => {
    await expect(
      createMessage(client, "ord_1", { body: "sneaky", internal: true }),
    ).rejects.toMatchObject({ status: 400 });
    expect(messageCreate).not.toHaveBeenCalled();
  });

  it("returns 404 when a stranger posts to someone else's order", async () => {
    await expect(
      createMessage(stranger, "ord_1", { body: "hey", internal: false }),
    ).rejects.toMatchObject({ status: 404 });
    expect(messageCreate).not.toHaveBeenCalled();
  });
});
