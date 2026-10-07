import { RATE_LIMITS } from "@/config/constants";
import { withMiddleware } from "@/lib/api/with-middleware";
import { validateBody, rateLimit } from "@/lib/api/middlewares";
import { getBody } from "@/lib/api/request";
import { created } from "@/lib/api/response";
import { registerUser } from "@/lib/users";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";
import type { Handler } from "@/lib/api/types";

const postHandler: Handler = async (req) => {
  const input = getBody<RegisterInput>(req);
  const user = await registerUser(input);
  return created(user);
};

// Public route: no authenticate. Auth endpoints get the stricter rate limit.
export const POST = withMiddleware(postHandler, [rateLimit(RATE_LIMITS.auth), validateBody(registerSchema)]);
