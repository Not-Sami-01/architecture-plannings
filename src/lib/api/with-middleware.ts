import { randomUUID } from "node:crypto";

import { DEFAULT_ERROR_MESSAGE, ERROR_CODES } from "@/config/constants";
import type { NextRequest } from "next/server";

import { ApiError, fail } from "./response";
import { defaultMiddlewares } from "./middlewares";
import type { ApiRequest, ApiResponse, Handler, Middleware, RouteContext } from "./types";

export type WithMiddlewareOptions = {
  /** Skip `defaultMiddlewares` (used by webhooks that verify raw signatures). */
  skipDefaults?: boolean;
};

/**
 * Wraps a route handler: builds `req.ctx`/`res`, runs default middlewares then
 * the route's middlewares in order, converts `ApiError` to the standard error
 * response, merges middleware headers, and logs method/path/status/duration.
 *
 * Usage: `export const GET = withMiddleware(getHandler, [authenticate]);`
 */
export function withMiddleware(
  handler: Handler,
  middlewares: Middleware[] = [],
  options: WithMiddlewareOptions = {}
) {
  return async function routeHandler(
    nextReq: NextRequest,
    routeCtx?: RouteContext
  ): Promise<Response> {
    const requestId = randomUUID();
    const startedAt = performance.now();

    const req = nextReq as ApiRequest;
    req.ctx = {
      requestId,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      params: routeCtx ? await routeCtx.params : {},
      query: Object.fromEntries(new URL(req.url).searchParams),
      body: undefined,
      user: null,
    };

    if (["POST", "PATCH", "PUT", "DELETE"].includes(req.method)) {
      // Webhooks and multipart uploads read the raw request instead.
      req.ctx.body = await req.json().catch(() => undefined);
    }

    const res: ApiResponse = { headers: new Headers(), locals: {} };

    const respond = (response: Response): Response => {
      const headers = new Headers(response.headers);
      res.headers.forEach((value, key) => headers.set(key, value));
      headers.set("X-Request-Id", requestId);
      const durationMs = Math.round(performance.now() - startedAt);
      // Never log request bodies, tokens, or URLs of signed downloads.
      console.log(`${req.method} ${new URL(req.url).pathname} ${response.status} ${durationMs}ms [${requestId}]`);
      return new Response(response.body, { status: response.status, headers });
    };

    const chain = options.skipDefaults ? middlewares : [...defaultMiddlewares, ...middlewares];

    try {
      for (const middleware of chain) {
        const result = await middleware(req, res);
        if (!result.success) {
          return respond(fail(result.status, result.message, result.code, result.details));
        }
      }
      const response = await handler(req);
      return respond(response);
    } catch (error) {
      if (error instanceof ApiError) {
        return respond(fail(error.status, error.message, error.code, error.details));
      }
      console.error(`${req.method} ${new URL(req.url).pathname} unhandled error [${requestId}]`, error);
      return respond(fail(500, DEFAULT_ERROR_MESSAGE, ERROR_CODES.INTERNAL_ERROR));
    }
  };
}
