import type { ApiRequest, ApiResponse } from "./types";

/** Builds an ApiRequest with a fully populated `ctx`, without needing Next.js. */
export function makeApiRequest(
  options: {
    url?: string;
    method?: string;
    body?: unknown;
    params?: Record<string, string>;
    headers?: Record<string, string>;
    userId?: string;
  } = {}
): ApiRequest {
  const url = options.url ?? "http://localhost:3000/api/test";
  const init: RequestInit = { method: options.method ?? "GET", headers: options.headers };
  if (options.body !== undefined) init.body = JSON.stringify(options.body);

  const req = new Request(url, init) as unknown as ApiRequest;
  req.ctx = {
    requestId: "test-request-id",
    ip: "203.0.113.7",
    params: options.params ?? {},
    query: Object.fromEntries(new URL(url).searchParams),
    body: options.body,
    user: options.userId
      ? { id: options.userId, name: "Test User", email: "user@test.dev", role: "CLIENT" }
      : null,
  };
  return req;
}

export function makeApiResponse(): ApiResponse {
  return { headers: new Headers(), locals: {} };
}
