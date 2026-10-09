import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, rateLimit } from "@/lib/api/middlewares";
import { getUser } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { createRealtimeTokenRequest } from "@/lib/realtime";
import { RATE_LIMITS } from "@/config/constants";
import type { TokenRequest } from "ably";
import type { Handler } from "@/lib/api/types";

type RealtimeTokenResponse = {
  enabled: boolean;
  tokenRequest: TokenRequest | null;
};

const postHandler: Handler = async (req) => {
  const user = getUser(req);

  // Single-use request: the Ably SDK calls this again on every renewal.
  // `enabled: false` tells the client realtime is off (unset ABLY_API_KEY).
  const tokenRequest = await createRealtimeTokenRequest(user);
  const body: RealtimeTokenResponse = {
    enabled: tokenRequest !== null,
    tokenRequest,
  };
  return ok(body);
};

export const POST = withMiddleware(postHandler, [authenticate, rateLimit(RATE_LIMITS.realtime)]);
