import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole, validateBody } from "@/lib/api/middlewares";
import { getBody, getParam, getUser } from "@/lib/api/request";
import { created } from "@/lib/api/response";
import { createOrderPayment } from "@/lib/payments";
import { createPaymentSchema, type CreatePaymentInput } from "@/lib/validators/payments";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

const postHandler: Handler = async (req) => {
  const user = getUser(req);
  return created(await createOrderPayment(user, getParam(req, "id"), getBody<CreatePaymentInput>(req)));
};

export const POST = withMiddleware(postHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateBody(createPaymentSchema),
]);
