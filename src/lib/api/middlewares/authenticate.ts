import { auth } from "@clerk/nextjs/server";

import { ERROR_CODES } from "@/config/constants";
import { resolveApiUser } from "@/lib/users";

import { pass, reject } from "./helpers";
import type { Middleware } from "../types";

/** Requires a Clerk session; sets `req.ctx.user` for downstream middlewares and handlers. */
export const authenticate: Middleware = async (req, res) => {
  const { userId } = await auth();

  if (!userId) {
    return reject(req, res, 401, "You must be signed in to do that.", {
      code: ERROR_CODES.UNAUTHENTICATED,
    });
  }

  req.ctx.user = await resolveApiUser(userId);
  return pass(req, res);
};
