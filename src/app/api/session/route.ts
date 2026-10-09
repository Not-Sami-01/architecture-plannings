import { auth } from "@clerk/nextjs/server";

import { withMiddleware } from "@/lib/api/with-middleware";
import { ok } from "@/lib/api/response";
import { resolveApiUser } from "@/lib/users";
import type { Handler } from "@/lib/api/types";

/**
 * Session in the standard `{ data }` envelope for feature hooks (RULES.md §3
 * wants one envelope everywhere, so hooks use this thin read-only wrapper
 * instead of a provider-specific shape).
 */
const getHandler: Handler = async () => {
  const { userId } = await auth();
  if (!userId) return ok(null);
  const user = await resolveApiUser(userId);
  return ok({ id: user.id, name: user.name, email: user.email, role: user.role });
};

export const GET = withMiddleware(getHandler, []);
