import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole, validateBody } from "@/lib/api/middlewares";
import { getBody, getParam, getUser } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { registerDraft } from "@/lib/admin-orders";
import {
  registerDraftSchema,
  type RegisterDraftInput,
} from "@/lib/validators/admin-orders";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

/** POST /api/admin/orders/:id/drafts — deliver a draft (plan 3 P3). */
const postHandler: Handler = async (req) => {
  const user = getUser(req);
  return ok(
    await registerDraft(user, getParam(req, "id"), getBody<RegisterDraftInput>(req)),
  );
};

export const POST = withMiddleware(postHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateBody(registerDraftSchema),
]);
