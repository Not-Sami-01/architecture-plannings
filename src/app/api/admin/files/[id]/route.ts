import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole, validateBody } from "@/lib/api/middlewares";
import { getBody, getParam, getUser } from "@/lib/api/request";
import { noContent, ok } from "@/lib/api/response";
import { deleteFileForAdmin, updateFileForAdmin } from "@/lib/admin-files";
import { adminFileUpdateSchema, type AdminFileUpdateInput } from "@/lib/validators/admin-files";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

const patchHandler: Handler = async (req) => {
  const user = getUser(req);
  const id = getParam(req, "id");
  return ok(await updateFileForAdmin(user, id, getBody<AdminFileUpdateInput>(req)));
};

const deleteHandler: Handler = async (req) => {
  const user = getUser(req);
  const id = getParam(req, "id");
  await deleteFileForAdmin(user, id);
  return noContent();
};

export const PATCH = withMiddleware(patchHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateBody(adminFileUpdateSchema),
]);

export const DELETE = withMiddleware(deleteHandler, [authenticate, requireRole(ROLES.ADMIN)]);
