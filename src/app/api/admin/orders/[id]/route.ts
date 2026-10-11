import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole, validateBody } from "@/lib/api/middlewares";
import { getBody, getParam, getUser } from "@/lib/api/request";
import { noContent, ok } from "@/lib/api/response";
import {
  deleteOrderForAdmin,
  getOrderForAdmin,
  updateOrderForAdmin,
} from "@/lib/admin-orders";
import {
  adminOrderUpdateSchema,
  type AdminOrderUpdateInput,
} from "@/lib/validators/admin-orders";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

const getHandler: Handler = async (req) => {
  const user = getUser(req);
  const id = getParam(req, "id");
  return ok(await getOrderForAdmin(user, id));
};

const patchHandler: Handler = async (req) => {
  const user = getUser(req);
  const id = getParam(req, "id");
  return ok(await updateOrderForAdmin(user, id, getBody<AdminOrderUpdateInput>(req)));
};

// Hard delete (plan decision 1): rows + storage purged; destructive.
const deleteHandler: Handler = async (req) => {
  const user = getUser(req);
  const id = getParam(req, "id");
  await deleteOrderForAdmin(user, id);
  return noContent();
};

export const GET = withMiddleware(getHandler, [authenticate, requireRole(ROLES.ADMIN)]);

export const PATCH = withMiddleware(patchHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateBody(adminOrderUpdateSchema),
]);

export const DELETE = withMiddleware(deleteHandler, [authenticate, requireRole(ROLES.ADMIN)]);
