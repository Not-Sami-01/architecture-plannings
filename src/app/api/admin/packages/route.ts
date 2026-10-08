import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole, validateBody } from "@/lib/api/middlewares";
import { getBody } from "@/lib/api/request";
import { created, ok } from "@/lib/api/response";
import { createPackage, listAllPackages } from "@/lib/packages";
import { createPackageSchema, type CreatePackageInput } from "@/lib/validators/admin-packages";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

const getHandler: Handler = async () => {
  return ok(await listAllPackages());
};

const postHandler: Handler = async (req) => {
  return created(await createPackage(getBody<CreatePackageInput>(req)));
};

export const GET = withMiddleware(getHandler, [authenticate, requireRole(ROLES.ADMIN)]);

export const POST = withMiddleware(postHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateBody(createPackageSchema),
]);
