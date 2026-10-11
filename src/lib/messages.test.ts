import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/db", () => {
  const prisma = {
    order: { findUnique: vi.fn() },
    message: { findMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    messageRead: { createMany: vi.fn() },
    orderFile: { findMany: vi.fn(), deleteMany: vi.fn() },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma)),
  };
  return { prisma };
});

vi.mock("@/lib/realtime", () => ({
  publishUserEvent: vi.fn(async () => undefined),
  publishAdminsEvent: vi.fn(async () => undefined),
}));

vi.mock("@/lib/storage", () => ({
  deleteObject: vi.fn(async () => undefined),
}));

import { prisma } from "@/lib/db";
import { publishAdminsEvent, publishUserEvent } from "@/lib/realtime";
import { ApiError } from "@/lib/api/response";
import { ROLES } from "@/config/constants";
import type { ApiUser } from "@/lib/api/types";

import {
  countUnreadMessages,
  createMessage,
  deleteMessage,
  listMessages,
  markMessagesRead,
  updateMessage,
} from "./messages";

const orderFindUnique = prisma.order.findUnique as unknown as Mock;
const messageFindMany = prisma.message.findMany as unknown as Mock;
const messageCreate = prisma.message.create as unknown as Mock;
const messageFindUnique = prisma.message.findUnique as unknown as Mock;
const messageUpdate = prisma.message.update as unknown as Mock;
const messageDelete = prisma.message.delete as unknown as Mock;
const messageCount = prisma.message.count as unknown as Mock;
const messageReadCreateMany = prisma.messageRead.createMany as unknown as Mock;
const orderFileFindMany = prisma.orderFile.findMany as unknown as Mock;
const orderFileDeleteMany = prisma.orderFile.deleteMany as unknown as Mock;
const publishUser = publishUserEvent as unknown as Mock;
const publishAdmins = publishAdminsEvent as unknown as Mock;

const client: ApiUser = { id: "usr_client", email: "c@test.dev", role: ROLES.CLIENT };
const admin: ApiUser = { id: "usr_admin", email: "a@test.dev", role: ROLES.ADMIN };
const stranger: ApiUser = { id: "usr_other", email: "o@test.dev", role: ROLES.CLIENT };

beforeEach(() => {
  vi.clearAllMocks();
  orderFindUnique.mockResolvedValue({ id: "ord_1", userId: "usr_client" });
  messageFindUnique.mockResolvedValue(null);
  messageUpdate.mockResolvedValue({});
  messageCount.mockResolvedValue(0);
  messageReadCreateMany.mockResolvedValue({ count: 0 });
  orderFileFindMany.mockResolvedValue([]);
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

  it("validates attachments: unconfirmed or foreign files are rejected", async () => {
    orderFileFindMany.mockResolvedValue([
      {
        id: "file_1",
        uploadedById: client.id,
        orderId: "ord_1",
        messageId: null,
        kind: "CHAT_ATTACHMENT",
        confirmedAt: null, // not confirmed yet
      },
    ]);

    await expect(
      createMessage(client, "ord_1", { body: "see attached", internal: false, fileIds: ["file_1"] }),
    ).rejects.toMatchObject({ status: 400 });
    expect(messageCreate).not.toHaveBeenCalled();
  });

  it("connects valid own chat attachments in the same create", async () => {
    orderFileFindMany.mockResolvedValue([
      {
        id: "file_1",
        uploadedById: client.id,
        orderId: "ord_1",
        messageId: null,
        kind: "CHAT_ATTACHMENT",
        confirmedAt: new Date(),
      },
    ]);

    await createMessage(client, "ord_1", { body: "see attached", internal: false, fileIds: ["file_1"] });

    expect(messageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          attachments: { connect: [{ id: "file_1" }] },
        }),
      }),
    );
  });
});

describe("createMessage", () => {
  it("a client message is stored as public and pings the admins", async () => {
    const message = await createMessage(client, "ord_1", { body: "Hi", internal: false, fileIds: [] });
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
    const message = await createMessage(admin, "ord_1", { body: "Noted", internal: true, fileIds: [] });
    expect(message.internal).toBe(true);
    // Internal notes ping the owner's channel so their thread refreshes.
    expect(publishUser).toHaveBeenCalledWith("usr_client", expect.anything());
    expect(publishAdmins).not.toHaveBeenCalled();
  });

  it("rejects internal:true from a client (400, no leak)", async () => {
    await expect(
      createMessage(client, "ord_1", { body: "sneaky", internal: true, fileIds: [] }),
    ).rejects.toMatchObject({ status: 400 });
    expect(messageCreate).not.toHaveBeenCalled();
  });

  it("returns 404 when a stranger posts to someone else's order", async () => {
    await expect(
      createMessage(stranger, "ord_1", { body: "hey", internal: false, fileIds: [] }),
    ).rejects.toMatchObject({ status: 404 });
    expect(messageCreate).not.toHaveBeenCalled();
  });
});

describe("updateMessage", () => {
  beforeEach(() => {
    messageFindUnique.mockResolvedValue({
      id: "msg_1",
      orderId: "ord_1",
      senderId: client.id,
      internal: false,
      attachments: [],
    });
  });

  it("the author edits their own message and editedAt is stamped", async () => {
    await updateMessage(client, "ord_1", "msg_1", { body: "edited" });

    expect(messageUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "msg_1" },
        data: expect.objectContaining({ body: "edited", editedAt: expect.any(Date) }),
      }),
    );
    // The client edited, so the admins' channel is pinged.
    expect(publishAdmins).toHaveBeenCalledWith({ type: "message.updated", refId: "ord_1" });
  });

  it("a client cannot edit someone else's message (404)", async () => {
    messageFindUnique.mockResolvedValueOnce({
      id: "msg_1",
      orderId: "ord_1",
      senderId: "usr_other",
      internal: false,
      attachments: [],
    });

    await expect(updateMessage(client, "ord_1", "msg_1", { body: "hacked" })).rejects.toMatchObject({
      status: 404,
    });
    expect(messageUpdate).not.toHaveBeenCalled();
  });

  it("an admin edits any message (moderation)", async () => {
    const result = await updateMessage(admin, "ord_1", "msg_1", { body: "cleaned up" });
    expect(result).toBeTruthy();
    expect(messageUpdate).toHaveBeenCalled();
  });

  it("a client cannot flip the internal flag on edit (400)", async () => {
    await expect(
      updateMessage(client, "ord_1", "msg_1", { body: "edited", internal: true }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("clients cannot even see internal notes (404 on edit attempt)", async () => {
    messageFindUnique.mockResolvedValueOnce({
      id: "msg_note",
      orderId: "ord_1",
      senderId: admin.id,
      internal: true,
      attachments: [],
    });

    await expect(updateMessage(client, "ord_1", "msg_note", { body: "x" })).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe("deleteMessage", () => {
  beforeEach(() => {
    messageFindUnique.mockResolvedValue({
      id: "msg_1",
      orderId: "ord_1",
      senderId: client.id,
      internal: false,
      attachments: [{ id: "file_1", key: "orders/ord_1/chat_attachments/file_1-a.jpg" }],
    });
  });

  it("purges attachment rows with the message and pings the thread", async () => {
    await deleteMessage(client, "ord_1", "msg_1");

    expect(orderFileDeleteMany).toHaveBeenCalledWith({ where: { messageId: "msg_1" } });
    expect(messageDelete).toHaveBeenCalledWith({ where: { id: "msg_1" } });
    expect(publishAdmins).toHaveBeenCalledWith({ type: "message.deleted", refId: "ord_1" });
  });

  it("only the author (or an admin) may delete (404 otherwise)", async () => {
    messageFindUnique.mockResolvedValueOnce({
      id: "msg_1",
      orderId: "ord_1",
      senderId: admin.id,
      internal: false,
      attachments: [],
    });

    await expect(deleteMessage(client, "ord_1", "msg_1")).rejects.toMatchObject({ status: 404 });
    expect(messageDelete).not.toHaveBeenCalled();
  });

  it("an admin deletes any message in any thread", async () => {
    messageFindUnique.mockResolvedValueOnce({
      id: "msg_1",
      orderId: "ord_1",
      senderId: "usr_client",
      internal: false,
      attachments: [],
    });

    await expect(deleteMessage(admin, "ord_1", "msg_1")).resolves.toBeUndefined();
    expect(messageDelete).toHaveBeenCalled();
  });
});

describe("markMessagesRead", () => {
  beforeEach(() => {
    messageFindMany.mockResolvedValue([
      { id: "msg_a", senderId: admin.id, internal: false },
      { id: "msg_b", senderId: "usr_admin2", internal: true },
      { id: "msg_c", senderId: client.id, internal: false },
    ]);
    messageReadCreateMany.mockResolvedValue({ count: 1 });
  });

  it("keeps only counterpart + visible messages and pings the admins", async () => {
    const result = await markMessagesRead(client, "ord_1", ["msg_a", "msg_b", "msg_c"]);

    // msg_b is internal (invisible to clients) and msg_c is the client's own.
    expect(messageReadCreateMany).toHaveBeenCalledWith({
      data: [{ messageId: "msg_a", readerId: client.id }],
      skipDuplicates: true,
    });
    expect(result).toEqual({ marked: 1 });
    expect(publishAdmins).toHaveBeenCalledWith({ type: "message.read", refId: "ord_1" });
  });

  it("an admin may mark internal notes read too", async () => {
    await markMessagesRead(admin, "ord_1", ["msg_a", "msg_b", "msg_c"]);

    // Own message (msg_a) is skipped; a colleague's internal note counts.
    expect(messageReadCreateMany).toHaveBeenCalledWith({
      data: [
        { messageId: "msg_b", readerId: admin.id },
        { messageId: "msg_c", readerId: admin.id },
      ],
      skipDuplicates: true,
    });
  });

  it("skips the ping when nothing new was written (idempotent re-open)", async () => {
    messageReadCreateMany.mockResolvedValueOnce({ count: 0 });

    const result = await markMessagesRead(client, "ord_1", ["msg_a"]);

    expect(result).toEqual({ marked: 0 });
    expect(publishAdmins).not.toHaveBeenCalled();
    expect(publishUser).not.toHaveBeenCalled();
  });

  it("silently no-ops on an empty eligible set without writing", async () => {
    messageFindMany.mockResolvedValueOnce([]);
    const result = await markMessagesRead(client, "ord_1", ["msg_foreign"]);
    expect(result).toEqual({ marked: 0 });
    expect(messageReadCreateMany).not.toHaveBeenCalled();
  });

  it("returns 404 for a stranger probing another client's thread", async () => {
    await expect(markMessagesRead(stranger, "ord_1", ["msg_a"])).rejects.toMatchObject({
      status: 404,
    });
    expect(messageReadCreateMany).not.toHaveBeenCalled();
  });

  it("pings the client channel when an admin marks messages read", async () => {
    await markMessagesRead(admin, "ord_1", ["msg_c"]);
    expect(publishUser).toHaveBeenCalledWith("usr_client", { type: "message.read", refId: "ord_1" });
  });
});

describe("countUnreadMessages", () => {
  it("counts counterpart messages with no read row (clients exclude internal)", async () => {
    messageCount.mockResolvedValueOnce(3);

    const result = await countUnreadMessages(client, "ord_1");

    expect(result).toEqual({ count: 3 });
    expect(messageCount).toHaveBeenCalledWith({
      where: {
        orderId: "ord_1",
        senderId: { not: client.id },
        internal: false,
        reads: { none: { readerId: client.id } },
      },
    });
  });

  it("admins count internal notes as unread as well", async () => {
    await countUnreadMessages(admin, "ord_1");

    const where = (messageCount as Mock).mock.calls[0][0].where;
    expect("internal" in where).toBe(false);
    expect(where.reads).toEqual({ none: { readerId: admin.id } });
  });

  it("returns 404 for strangers", async () => {
    await expect(countUnreadMessages(stranger, "ord_1")).rejects.toMatchObject({ status: 404 });
  });
});
