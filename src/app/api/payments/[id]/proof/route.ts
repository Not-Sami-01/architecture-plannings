import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, validateBody } from "@/lib/api/middlewares";
import { getBody, getParam, getUser } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { attachPaymentProof } from "@/lib/payments";
import { paymentProofSchema, type PaymentProofInput } from "@/lib/validators/payments";
import type { Handler } from "@/lib/api/types";

// Client attaches a PAYMENT_PROOF file to their own pending payment;
// ownership and file eligibility are enforced in the service (404/400).
const postHandler: Handler = async (req) => {
  const user = getUser(req);
  return ok(await attachPaymentProof(user, getParam(req, "id"), getBody<PaymentProofInput>(req)));
};

export const POST = withMiddleware(postHandler, [
  authenticate,
  validateBody(paymentProofSchema),
]);
