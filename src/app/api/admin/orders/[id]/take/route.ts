import { z } from "zod";

import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole, validateBody } from "@/lib/api/middlewares";
import { getBody, getParam, getUser } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { takeOrder } from "@/lib/admin-orders";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

const takeSchema = z.object({ take: z.boolean() });

const postHandler: Handler = async (req) => {
  const user = getUser(req);
  const id = getParam(req, "id");
  const { take } = getBody<{ take: boolean }>(req);
  return ok(await takeOrder(user, id, take));
};

export const POST = withMiddleware(postHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateBody(takeSchema),
]);
