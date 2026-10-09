import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, rateLimit, validateBody } from "@/lib/api/middlewares";
import { getBody, getParam, getUser } from "@/lib/api/request";
import { ok, created } from "@/lib/api/response";
import { createMessage, listMessages } from "@/lib/messages";
import { messageSchema, type MessageInput } from "@/lib/validators/message";
import { RATE_LIMITS } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

const getHandler: Handler = async (req) => {
  const user = getUser(req);
  return ok(await listMessages(user, getParam(req, "id")));
};

const postHandler: Handler = async (req) => {
  const user = getUser(req);
  return created(await createMessage(user, getParam(req, "id"), getBody<MessageInput>(req)));
};

// Ownership and the internal-note rule are checked in the service (404/400).
export const GET = withMiddleware(getHandler, [authenticate]);

export const POST = withMiddleware(postHandler, [
  authenticate,
  validateBody(messageSchema),
  rateLimit(RATE_LIMITS.messages),
]);
