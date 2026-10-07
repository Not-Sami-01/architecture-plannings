import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole } from "@/lib/api/middlewares";
import { getParam, getUser } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { getOrderForAdmin } from "@/lib/admin-orders";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

const getHandler: Handler = async (req) => {
  const user = getUser(req);
  const id = getParam(req, "id");
  return ok(await getOrderForAdmin(user, id));
};

export const GET = withMiddleware(getHandler, [authenticate, requireRole(ROLES.ADMIN)]);
