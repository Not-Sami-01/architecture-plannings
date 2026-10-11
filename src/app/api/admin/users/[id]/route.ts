import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole, validateBody } from "@/lib/api/middlewares";
import { getBody, getParam, getUser } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { updateUserForAdmin } from "@/lib/admin-users";
import { adminUserUpdateSchema, type AdminUserUpdateInput } from "@/lib/validators/admin-users";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

const patchHandler: Handler = async (req) => {
  const user = getUser(req);
  const id = getParam(req, "id");
  return ok(await updateUserForAdmin(user, id, getBody<AdminUserUpdateInput>(req)));
};

export const PATCH = withMiddleware(patchHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateBody(adminUserUpdateSchema),
]);
