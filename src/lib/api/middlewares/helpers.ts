import type { ApiErrorCode } from "@/config/constants";

import type { ApiRequest, ApiResponse, MiddlewareResult } from "../types";

/** Continue the chain. */
export function pass(req: ApiRequest, res: ApiResponse): MiddlewareResult {
  return { success: true, message: "OK", req, res, status: 200 };
}

/** Stop the chain and return `fail(status, message, code, details)` to the client. */
export function reject(
  req: ApiRequest,
  res: ApiResponse,
  status: number,
  message: string,
  options?: { code?: ApiErrorCode; details?: unknown }
): MiddlewareResult {
  return {
    success: false,
    message,
    req,
    res,
    status,
    code: options?.code,
    details: options?.details,
  };
}
