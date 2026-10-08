import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole, validateBody } from "@/lib/api/middlewares";
import { getBody, getParam } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { deactivatePackage, updatePackage } from "@/lib/packages";
import { updatePackageSchema, type UpdatePackageInput } from "@/lib/validators/admin-packages";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

const patchHandler: Handler = async (req) => {
  const id = getParam(req, "id");
  return ok(await updatePackage(id, getBody<UpdatePackageInput>(req)));
};

const deleteHandler: Handler = async (req) => {
  const id = getParam(req, "id");
  return ok(await deactivatePackage(id));
};

export const PATCH = withMiddleware(patchHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateBody(updatePackageSchema),
]);

export const DELETE = withMiddleware(deleteHandler, [authenticate, requireRole(ROLES.ADMIN)]);
