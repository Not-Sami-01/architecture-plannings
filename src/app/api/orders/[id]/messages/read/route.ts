import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, rateLimit, validateBody } from "@/lib/api/middlewares";
import { getBody, getParam, getUser } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { markMessagesRead } from "@/lib/messages";
import { markReadSchema, type MarkReadInput } from "@/lib/validators/message";
import { RATE_LIMITS } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

// Bulk read receipts (plan 2 P2). Thread access and eligibility are enforced
// in the service; probing foreign ids never reveals whether they exist.
const postHandler: Handler = async (req) => {
  const user = getUser(req);
  return ok(await markMessagesRead(user, getParam(req, "id"), getBody<MarkReadInput>(req).messageIds));
};

export const POST = withMiddleware(postHandler, [
  authenticate,
  validateBody(markReadSchema),
  rateLimit(RATE_LIMITS.messages),
]);
