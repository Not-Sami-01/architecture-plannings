import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate } from "@/lib/api/middlewares";
import { getParam, getUser } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { countUnreadMessages } from "@/lib/messages";
import type { Handler } from "@/lib/api/types";

const getHandler: Handler = async (req) => {
  const user = getUser(req);
  return ok(await countUnreadMessages(user, getParam(req, "id")));
};

export const GET = withMiddleware(getHandler, [authenticate]);
