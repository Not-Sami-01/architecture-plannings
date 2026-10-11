import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/api/response";
import { ROLES } from "@/config/constants";
import type { ApiUser } from "@/lib/api/types";
import type { AdminUserListQuery, AdminUserUpdateInput } from "@/lib/validators/admin-users";
import { setUserRole } from "@/lib/users";

/** Admin user management (plan C1). Users are never deleted or deactivated. */

const userRowSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  _count: { select: { orders: true } },
} as const;

export async function listUsersForAdmin(user: ApiUser, query: AdminUserListQuery) {
  if (user.role !== ROLES.ADMIN) throw ApiError.notFound();

  const where = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" as const } },
            { email: { contains: query.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: userRowSelect,
    }),
    prisma.user.count({ where }),
  ]);

  return { items, meta: { page: query.page, pageSize: query.pageSize, total } };
}

export async function updateUserForAdmin(user: ApiUser, userId: string, input: AdminUserUpdateInput) {
  if (user.role !== ROLES.ADMIN) throw ApiError.notFound();

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, clerkId: true },
  });
  if (!target) throw ApiError.notFound();

  if (input.role) {
    // Writes Clerk metadata (source of truth) and the DB mirror together —
    // visible on the user's next request, no Clerk-dashboard token editing.
    await setUserRole(target.id, target.clerkId, input.role);
  }

  return prisma.user.update({
    where: { id: userId },
    data: { ...(input.name !== undefined ? { name: input.name } : {}) },
    select: userRowSelect,
  });
}
