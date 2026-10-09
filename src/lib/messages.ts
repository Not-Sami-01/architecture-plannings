import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/response";
import { REALTIME_EVENTS, ROLES } from "@/config/constants";
import type { ApiUser } from "@/lib/api/types";
import type { MessageInput } from "@/lib/validators/message";
import { publishAdminsEvent, publishUserEvent } from "@/lib/realtime";

/** Per-order chat (API.md §6). Business logic lives here, never in components. */

/**
 * Ownership gate: strangers get 404 (existence never leaks), admins may read
 * every thread. Shared by list and send.
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
  createdAt: true,
  sender: { select: { id: true, name: true, role: true } },
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

export async function createMessage(user: ApiUser, orderId: string, input: MessageInput) {
  const order = await requireThreadAccess(user, orderId);

  // The ownership check above passed, so this is an input violation, not an
  // existence leak: internal notes are an admin-only feature.
  if (input.internal && user.role !== ROLES.ADMIN) {
    throw ApiError.badRequest("Internal notes can only be posted by the designer.");
  }

  const message = await prisma.message.create({
    data: {
      orderId: order.id,
      senderId: user.id,
      body: input.body,
      internal: input.internal,
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
