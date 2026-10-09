import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole, validateBody } from "@/lib/api/middlewares";
import { getBody, getParam, getUser } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { changeOrderStatus } from "@/lib/admin-orders";
import { statusChangeSchema, type StatusChangeInput } from "@/lib/validators/admin-orders";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

const postHandler: Handler = async (req) => {
  const user = getUser(req);
  const id = getParam(req, "id");
  const input = getBody<StatusChangeInput>(req);
  return ok(await changeOrderStatus(user, id, input));
};

export const POST = withMiddleware(postHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateBody(statusChangeSchema),
]);
