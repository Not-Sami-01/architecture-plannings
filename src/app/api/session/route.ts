import { withMiddleware } from "@/lib/api/with-middleware";
import { ok } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import type { Handler } from "@/lib/api/types";

/**
 * Session in the standard `{ data }` envelope for feature hooks. (Auth.js'
 * own /api/auth/session returns a provider-specific shape; RULES.md §3 wants
 * one envelope everywhere, so hooks use this thin read-only wrapper.)
 */
const getHandler: Handler = async () => {
  const session = await auth();
  if (!session?.user) return ok(null);
  return ok({ id: session.user.id, name: session.user.name, email: session.user.email, role: session.user.role });
};

export const GET = withMiddleware(getHandler, []);
