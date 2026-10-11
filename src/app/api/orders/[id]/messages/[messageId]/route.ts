import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, validateBody } from "@/lib/api/middlewares";
import { getBody, getParam, getUser } from "@/lib/api/request";
import { noContent, ok } from "@/lib/api/response";
import { deleteMessage, updateMessage } from "@/lib/messages";
import { messageUpdateSchema, type MessageUpdateInput } from "@/lib/validators/message";
import type { Handler } from "@/lib/api/types";

const patchHandler: Handler = async (req) => {
  const user = getUser(req);
  const orderId = getParam(req, "id");
  const messageId = getParam(req, "messageId");
  return ok(await updateMessage(user, orderId, messageId, getBody<MessageUpdateInput>(req)));
};

// Edit/delete permissions and the internal-flag rule are checked in the
// service (404/400). Admins edit any message; clients edit their own.
export const PATCH = withMiddleware(patchHandler, [authenticate, validateBody(messageUpdateSchema)]);

const deleteHandler: Handler = async (req) => {
  const user = getUser(req);
  const orderId = getParam(req, "id");
  const messageId = getParam(req, "messageId");
  await deleteMessage(user, orderId, messageId);
  return noContent();
};

export const DELETE = withMiddleware(deleteHandler, [authenticate]);
