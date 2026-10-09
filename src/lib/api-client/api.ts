import axios from "axios";

import {
  DEFAULT_ERROR_MESSAGE,
  ERROR_CODES,
  ROUTES,
  type ApiErrorCode,
} from "@/config/constants";
import type { PaginatedMeta } from "@/lib/api/response";

/**
 * The one HTTP client (RULES.md §3). Hooks call `api`; components never do.
 * - Unwraps the standard `{ data, meta? }` envelope.
 * - Converts failures into one typed `ApiClientError` (message, code, status, details).
 * - Handles expired sessions (401) in exactly one place (a Clerk sign-in page
 *   takes over via the redirect).
 * - Supports request cancellation via `signal`.
 *
 * Base URL is same-origin ("/"): the client always calls its own API, which
 * keeps dev ports and preview deployments working without configuration.
 * `publicConfig.appUrl` is reserved for absolute URLs (emails, OG metadata).
 */

export type ApiMethod = "get" | "post" | "patch" | "put" | "delete";

export type ApiRequestConfig = {
  url: string;
  body?: unknown;
  params?: Record<string, unknown>;
  signal?: AbortSignal;
};

export type ApiResult<data> = { data: data; meta?: PaginatedMeta };

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;

  constructor(status: number, message: string, code?: ApiErrorCode, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code ?? ERROR_CODES.INTERNAL_ERROR;
    this.details = details;
  }
}

const instance = axios.create({
  baseURL: "/",
  withCredentials: true,
});

function toApiClientError(error: unknown, url: string): ApiClientError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const payload = error.response?.data as
      | { error?: { code?: ApiErrorCode; message?: string; details?: unknown } }
      | undefined;
    return new ApiClientError(
      status,
      payload?.error?.message ?? error.message ?? DEFAULT_ERROR_MESSAGE,
      payload?.error?.code,
      payload?.error?.details
    );
  }
  return new ApiClientError(0, DEFAULT_ERROR_MESSAGE, ERROR_CODES.INTERNAL_ERROR, { url });
}

export async function api<data>(
  method: ApiMethod,
  config: ApiRequestConfig
): Promise<ApiResult<data>> {
  try {
    const response = await instance.request<{ data: data; meta?: PaginatedMeta }>({
      method,
      url: config.url,
      data: config.body,
      params: config.params,
      signal: config.signal,
    });
    return { data: response.data?.data, meta: response.data?.meta };
  } catch (error) {
    const clientError = toApiClientError(error, config.url);
    if (
      typeof window !== "undefined" &&
      clientError.status === 401
    ) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      // Full reload on purpose: it clears stale client state for an expired session.
      // Router hooks are unavailable in this non-React util, and RULES.md §3.7
      // requires the 401 redirect to live in exactly one place — here.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `${ROUTES.login}?next=${next}`;
    }
    throw clientError;
  }
}
