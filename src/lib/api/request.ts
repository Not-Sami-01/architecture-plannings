import { ApiError } from "./response";
import type { ApiRequest, ApiUser } from "./types";

/**
 * Typed accessors for the data middlewares put on `req.ctx` (API.md).
 * Handlers stay thin: get the input, call a service, return a helper response.
 */

export function getBody<T>(req: ApiRequest): T {
  return req.ctx.body as T;
}

export function getQuery<T>(req: ApiRequest): T {
  return req.ctx.query as T;
}

export function getParam(req: ApiRequest, name: string): string {
  const value = req.ctx.params[name];
  if (!value) {
    throw new Error(`Route param "${name}" is missing from the request context.`);
  }
  return value;
}

export function getUser(req: ApiRequest): ApiUser {
  const user = req.ctx.user;
  if (!user) {
    throw ApiError.unauthenticated();
  }
  return user;
}
