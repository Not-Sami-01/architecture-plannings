import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole, validateBody } from "@/lib/api/middlewares";
import { getBody, getParam, getUser } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { acceptRevision } from "@/lib/revisions";
import {
  acceptRevisionSchema,
  type AcceptRevisionInput,
} from "@/lib/validators/revisions";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

const patchHandler: Handler = async (req) => {
  const user = getUser(req);
  void getBody<AcceptRevisionInput>(req); // `{ action: "accept" }` — the only verb for now
  return ok(await acceptRevision(user, getParam(req, "id")));
};

export const PATCH = withMiddleware(patchHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateBody(acceptRevisionSchema),
]);
