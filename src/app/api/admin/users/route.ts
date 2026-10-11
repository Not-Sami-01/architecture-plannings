import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole, validateQuery } from "@/lib/api/middlewares";
import { getQuery, getUser } from "@/lib/api/request";
import { paginated } from "@/lib/api/response";
import { listUsersForAdmin } from "@/lib/admin-users";
import { adminUserListQuerySchema, type AdminUserListQuery } from "@/lib/validators/admin-users";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

const getHandler: Handler = async (req) => {
  const user = getUser(req);
  const { items, meta } = await listUsersForAdmin(user, getQuery<AdminUserListQuery>(req));
  return paginated(items, meta);
};

export const GET = withMiddleware(getHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateQuery(adminUserListQuerySchema),
]);
