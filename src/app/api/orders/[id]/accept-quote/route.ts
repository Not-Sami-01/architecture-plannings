import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate } from "@/lib/api/middlewares";
import { getParam, getUser } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { acceptQuote } from "@/lib/orders";
import type { Handler } from "@/lib/api/types";

const postHandler: Handler = async (req) => {
  const user = getUser(req);
  const id = getParam(req, "id");
  return ok(await acceptQuote(user, id));
};

// Client action: ownership + QUOTED state are checked in the service (404/409).
export const POST = withMiddleware(postHandler, [authenticate]);
