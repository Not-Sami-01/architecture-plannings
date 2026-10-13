import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole, validateBody } from "@/lib/api/middlewares";
import { getBody, getParam } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { setPostPublished } from "@/lib/posts";
import { publishPostSchema, type PublishPostInput } from "@/lib/validators/admin-posts";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

/** POST /api/admin/posts/:id/publish — { publish: true | false } (plan 6). */
const postHandler: Handler = async (req) => {
  const { publish } = getBody<PublishPostInput>(req);
  return ok(await setPostPublished(getParam(req, "id"), publish));
};

export const POST = withMiddleware(postHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateBody(publishPostSchema),
]);
