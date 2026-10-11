import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/response";
import { deleteObject } from "@/lib/storage";
import { REALTIME_EVENTS, ROLES } from "@/config/constants";
import type { ApiUser } from "@/lib/api/types";
import type { MessageInput, MessageUpdateInput } from "@/lib/validators/message";
import { publishAdminsEvent, publishUserEvent } from "@/lib/realtime";

/** Per-order chat (API.md §6). Business logic lives here, never in components. */

/**
 * Ownership gate: strangers get 404 (existence never leaks), admins may read
 * every thread. Shared by list, send, edit and delete.
 */
async function requireThreadAccess(user: ApiUser, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true },
  });
  const canSee = order && (user.role === ROLES.ADMIN || order.userId === user.id);
  if (!order || !canSee) throw ApiError.notFound();
  return order;
}

const messageSelect = {
  id: true,
  body: true,
  internal: true,
  editedAt: true,
  createdAt: true,
  sender: { select: { id: true, name: true, role: true } },
  attachments: {
    select: { id: true, filename: true, mime: true, size: true },
  },
} as const;

/** Chronological thread; clients never see internal admin notes. */
export async function listMessages(user: ApiUser, orderId: string) {
  await requireThreadAccess(user, orderId);

  return prisma.message.findMany({
    where: {
      orderId,
      ...(user.role === ROLES.ADMIN ? {} : { internal: false }),
    },
    orderBy: { createdAt: "asc" },
    select: messageSelect,
  });
}

/**
 * Validates chat attachment candidates: they must be confirmed uploads by
 * this sender, already attached to this order (presign `orderId`), of the
 * CHAT_ATTACHMENT kind, and not yet bound to another message.
 */
async function loadOwnChatAttachments(user: ApiUser, orderId: string, fileIds: string[]) {
  if (fileIds.length === 0) return [];

  const files = await prisma.orderFile.findMany({
    where: { id: { in: fileIds } },
    select: {
      id: true,
      uploadedById: true,
      orderId: true,
      messageId: true,
      kind: true,
      confirmedAt: true,
    },
  });

  const byId = new Map(files.map((file) => [file.id, file]));

  for (const fileId of fileIds) {
    const file = byId.get(fileId);
    if (
      !file ||
      file.uploadedById !== user.id ||
      file.orderId !== orderId ||
      file.messageId !== null ||
      file.kind !== "CHAT_ATTACHMENT" ||
      !file.confirmedAt
    ) {
      throw ApiError.badRequest("One of the attachments is not available. Please re-upload it.");
    }
  }
  return fileIds.map((id) => ({ id }));
}

export async function createMessage(user: ApiUser, orderId: string, input: MessageInput) {
  const order = await requireThreadAccess(user, orderId);

  // The ownership check above passed, so this is an input violation, not an
  // existence leak: internal notes are an admin-only feature.
  if (input.internal && user.role !== ROLES.ADMIN) {
    throw ApiError.badRequest("Internal notes can only be posted by the designer.");
  }

  const attachments = await loadOwnChatAttachments(user, order.id, input.fileIds ?? []);

  const message = await prisma.message.create({
    data: {
      orderId: order.id,
      senderId: user.id,
      body: input.body,
      internal: input.internal,
      ...(attachments.length
        ? { attachments: { connect: attachments } }
        : {}),
    },
    select: messageSelect,
  });

  // Ping the other side of the conversation (id-only, fire-and-forget).
  const event = { type: REALTIME_EVENTS.messageCreated, refId: order.id };
  if (user.role === ROLES.ADMIN) {
    void publishUserEvent(order.userId, event);
  } else {
    void publishAdminsEvent(event);
  }

  return message;
}

/**
 * Fetches a message for an edit/delete decision. Admins may moderate any
 * message in any thread they can see; clients may only touch their own
 * non-internal messages in their own thread (plan decision 3).
 */
async function getMessageForModeration(user: ApiUser, orderId: string, messageId: string) {
  const order = await requireThreadAccess(user, orderId);

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      orderId: true,
      senderId: true,
      internal: true,
      attachments: { select: { id: true, key: true } },
    },
  });

  if (!message || message.orderId !== order.id) throw ApiError.notFound();

  const isAdmin = user.role === ROLES.ADMIN;
  if (!isAdmin && message.senderId !== user.id) throw ApiError.notFound();
  // Internal notes are invisible to clients — touching one must 404 too.
  if (!isAdmin && message.internal) throw ApiError.notFound();

  return { order, message, isAdmin };
}

function pingThread(userId: string, senderRole: string, type: RealtimeEventType_, orderId: string) {
  const event = { type, refId: orderId };
  if (senderRole === ROLES.ADMIN) {
    void publishUserEvent(userId, event);
  } else {
    void publishAdminsEvent(event);
  }
}

type RealtimeEventType_ = (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

export async function updateMessage(
  user: ApiUser,
  orderId: string,
  messageId: string,
  input: MessageUpdateInput,
) {
  const { order, message, isAdmin } = await getMessageForModeration(user, orderId, messageId);

  // Clients can never set the internal flag (plan decision 3); admins keep it.
  if (!isAdmin && input.internal !== undefined) {
    throw ApiError.badRequest("Internal notes can only be managed by the designer.");
  }

  const updated = await prisma.message.update({
    where: { id: message.id },
    data: {
      body: input.body,
      editedAt: new Date(),
      ...(isAdmin && input.internal !== undefined ? { internal: input.internal } : {}),
    },
    select: messageSelect,
  });

  pingThread(order.userId, user.role, REALTIME_EVENTS.messageUpdated, order.id);
  return updated;
}

export async function deleteMessage(user: ApiUser, orderId: string, messageId: string) {
  const { order, message } = await getMessageForModeration(user, orderId, messageId);

  // Purge the attachment rows and their storage objects together. Storage is
  // removed first (plan guardrail: no orphaned bytes if the DB write fails) —
  // attachment rows only die with the message row, in the same transaction.
  const attachmentKeys = message.attachments.map((attachment) => attachment.key);
  await Promise.all(attachmentKeys.map((key) => deleteObject(key).catch(() => undefined)));

  await prisma.$transaction(async (tx) => {
    if (message.attachments.length) {
      await tx.orderFile.deleteMany({
        where: { messageId: message.id },
      });
    }
    await tx.message.delete({ where: { id: message.id } });
  });

  pingThread(order.userId, user.role, REALTIME_EVENTS.messageDeleted, order.id);
}
