import { ERROR_CODES, type Role } from "@/config/constants";

import { pass, reject } from "./helpers";
import type { Middleware } from "../types";

/** Role guard; must run after `authenticate`. */
export function requireRole(...roles: Role[]): Middleware {
  return async (req, res) => {
    const user = req.ctx.user;

    if (!user) {
      return reject(req, res, 401, "You must be signed in to do that.", {
        code: ERROR_CODES.UNAUTHENTICATED,
      });
    }

    if (!roles.includes(user.role)) {
      return reject(req, res, 403, "You do not have access to this resource.", {
        code: ERROR_CODES.FORBIDDEN,
      });
    }

    return pass(req, res);
  };
}
