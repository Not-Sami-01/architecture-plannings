import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole, validateQuery } from "@/lib/api/middlewares";
import { getQuery, getUser } from "@/lib/api/request";
import { paginated } from "@/lib/api/response";
import { listThreadsForAdmin } from "@/lib/admin-chats";
import { adminThreadListQuerySchema, type AdminThreadListQuery } from "@/lib/validators/admin-chats";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

const getHandler: Handler = async (req) => {
  const user = getUser(req);
  const { items, meta } = await listThreadsForAdmin(user, getQuery<AdminThreadListQuery>(req));
  return paginated(items, meta);
};

export const GET = withMiddleware(getHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateQuery(adminThreadListQuerySchema),
]);
