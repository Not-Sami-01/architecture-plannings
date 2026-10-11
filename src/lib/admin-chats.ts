import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/response";
import { ROLES } from "@/config/constants";
import type { ApiUser } from "@/lib/api/types";
import type { AdminThreadListQuery } from "@/lib/validators/admin-chats";

/**
 * Admin chats inbox (plan C2): orders that have messages, newest activity
 * first. `lastMessageAt` is computed from the thread's latest message and the
 * preview is truncated server-side so lists stay small.
 */
export async function listThreadsForAdmin(user: ApiUser, query: AdminThreadListQuery) {
  if (user.role !== ROLES.ADMIN) throw ApiError.notFound();

  const orders = await prisma.order.findMany({
    where: {
      messages: { some: {} },
      ...(query.q
        ? {
            OR: [
              { number: { contains: query.q, mode: "insensitive" as const } },
              { user: { name: { contains: query.q, mode: "insensitive" as const } } },
              { user: { email: { contains: query.q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      number: true,
      status: true,
      userId: true,
      user: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, sender: { select: { role: true, name: true } } },
      },
      _count: { select: { messages: true } },
    },
  });

  const items = orders
    .map((order) => {
      const latest = order.messages[0];
      return {
        id: order.id,
        number: order.number,
        status: order.status,
        client: order.user,
        messageCount: order._count.messages,
        lastMessageAt: latest?.createdAt ?? null,
        lastMessagePreview: latest
          ? latest.body.length > 120
            ? `${latest.body.slice(0, 120)}…`
            : latest.body
          : null,
        lastSenderRole: latest?.sender.role ?? null,
      };
    })
    .sort((a, b) => (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0));

  const total = items.length;
  const start = (query.page - 1) * query.pageSize;
  return {
    items: items.slice(start, start + query.pageSize),
    meta: { page: query.page, pageSize: query.pageSize, total },
  };
}
