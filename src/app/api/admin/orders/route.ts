import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole, validateQuery } from "@/lib/api/middlewares";
import { getQuery, getUser } from "@/lib/api/request";
import { paginated } from "@/lib/api/response";
import { listOrdersForAdmin } from "@/lib/admin-orders";
import { adminOrderListQuerySchema, type AdminOrderListQuery } from "@/lib/validators/admin-orders";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

const getHandler: Handler = async (req) => {
  const user = getUser(req);
  const query = getQuery<AdminOrderListQuery>(req);
  const { items, meta } = await listOrdersForAdmin(user, query);
  return paginated(items, meta);
};

export const GET = withMiddleware(getHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateQuery(adminOrderListQuerySchema),
]);
