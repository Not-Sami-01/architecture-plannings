import { RATE_LIMITS } from "@/config/constants";

import { rateLimit } from "./rate-limit";
import type { Middleware } from "../types";

export { pass, reject } from "./helpers";
export { authenticate } from "./authenticate";
export { requireRole } from "./require-role";
export { validateBody, validateQuery } from "./validate";
export { rateLimit } from "./rate-limit";

/** Runs before the route's own middlewares on every non-webhook route. */
export const defaultMiddlewares: Middleware[] = [rateLimit(RATE_LIMITS.default)];
