import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate } from "@/lib/api/middlewares";
import { getParam, getUser } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { listPaymentsForOrder } from "@/lib/payments";
import type { Handler } from "@/lib/api/types";

// Ownership (client: own order only) is enforced in the service → 404.
const getHandler: Handler = async (req) => {
  const user = getUser(req);
  return ok(await listPaymentsForOrder(user, getParam(req, "id")));
};

export const GET = withMiddleware(getHandler, [authenticate]);
