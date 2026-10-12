import { withMiddleware } from "@/lib/api/with-middleware";
import {
  authenticate,
  rateLimit,
  validateBody,
  validateQuery,
} from "@/lib/api/middlewares";
import { getBody, getQuery, getUser } from "@/lib/api/request";
import { created, paginated } from "@/lib/api/response";
import { createOrder, listOrdersForUser } from "@/lib/orders";
import {
  orderListQuerySchema,
  orderSchema,
  type OrderInput,
  type OrderListQuery,
} from "@/lib/validators/order";
import type { Handler } from "@/lib/api/types";

const postHandler: Handler = async (req) => {
  const user = getUser(req);
  const input = getBody<OrderInput>(req);
  const order = await createOrder(user, input);
  return created(order);
};

const getHandler: Handler = async (req) => {
  const user = getUser(req);
  const { items, meta } = await listOrdersForUser(user, getQuery<OrderListQuery>(req));
  return paginated(items, meta);
};

export const POST = withMiddleware(postHandler, [
  authenticate,
  rateLimit({ limit: 10, windowSeconds: 60 }),
  validateBody(orderSchema),
]);

export const GET = withMiddleware(getHandler, [authenticate, validateQuery(orderListQuerySchema)]);
