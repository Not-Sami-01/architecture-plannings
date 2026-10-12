import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole } from "@/lib/api/middlewares";
import { getUser } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { getAdminStats } from "@/lib/admin-stats";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

const getHandler: Handler = async (req) => {
  const user = getUser(req);
  return ok(await getAdminStats(user));
};

export const GET = withMiddleware(getHandler, [authenticate, requireRole(ROLES.ADMIN)]);
