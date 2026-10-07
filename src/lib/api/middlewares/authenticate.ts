import { ERROR_CODES } from "@/config/constants";
import { auth } from "@/lib/auth";

import { pass, reject } from "./helpers";
import type { Middleware } from "../types";

/** Requires a session; sets `req.ctx.user` for downstream middlewares and handlers. */
export const authenticate: Middleware = async (req, res) => {
  const session = await auth();

  if (!session?.user) {
    return reject(req, res, 401, "You must be signed in to do that.", {
      code: ERROR_CODES.UNAUTHENTICATED,
    });
  }

  req.ctx.user = session.user;
  return pass(req, res);
};
