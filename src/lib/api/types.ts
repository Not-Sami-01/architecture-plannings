import type { NextRequest } from "next/server";

import type { ApiErrorCode, Role } from "@/config/constants";

/**
 * Shared types for the API middleware framework (API.md, "Handler Architecture").
 *
 * `ApiRequest` is the incoming `NextRequest` enriched with `ctx`, a bag that
 * middlewares write to and handlers read from. `ApiResponse` is a mutable
 * holder whose headers are merged into the final response by `withMiddleware`.
 */

export type ApiUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
};

export type ApiRequestContext = {
  requestId: string;
  ip: string | null;
  params: Record<string, string>;
  // Parsed query values may be coerced (numbers, booleans) by validateQuery.
  query: Record<string, unknown>;
  body: unknown;
  user: ApiUser | null;
};

export type ApiRequest = NextRequest & { ctx: ApiRequestContext };

export type ApiResponse = {
  headers: Headers;
  locals: Record<string, unknown>;
};

export type MiddlewareResult = {
  success: boolean;
  message: string;
  req: ApiRequest;
  res: ApiResponse;
  status: number;
  code?: ApiErrorCode;
  details?: unknown;
};

export type Middleware = (
  req: ApiRequest,
  res: ApiResponse
) => MiddlewareResult | Promise<MiddlewareResult>;

export type Handler = (req: ApiRequest) => Promise<Response> | Response;

export type RouteContext = { params: Promise<Record<string, string>> };
