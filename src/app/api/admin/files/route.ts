import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole, validateQuery } from "@/lib/api/middlewares";
import { getQuery, getUser } from "@/lib/api/request";
import { paginated } from "@/lib/api/response";
import { listFilesForAdmin } from "@/lib/admin-files";
import { adminFileListQuerySchema, type AdminFileListQuery } from "@/lib/validators/admin-files";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

const getHandler: Handler = async (req) => {
  const user = getUser(req);
  const { items, meta } = await listFilesForAdmin(user, getQuery<AdminFileListQuery>(req));
  return paginated(items, meta);
};

export const GET = withMiddleware(getHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateQuery(adminFileListQuerySchema),
]);
