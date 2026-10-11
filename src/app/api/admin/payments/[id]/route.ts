import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole, validateBody } from "@/lib/api/middlewares";
import { getBody, getParam, getUser } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { verifyPayment } from "@/lib/payments";
import { verifyPaymentSchema, type VerifyPaymentInput } from "@/lib/validators/payments";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

const patchHandler: Handler = async (req) => {
  const user = getUser(req);
  return ok(await verifyPayment(user, getParam(req, "id"), getBody<VerifyPaymentInput>(req)));
};

export const PATCH = withMiddleware(patchHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateBody(verifyPaymentSchema),
]);
