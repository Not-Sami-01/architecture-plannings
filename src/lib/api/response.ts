import { DEFAULT_ERROR_MESSAGE, ERROR_CODES, type ApiErrorCode } from "@/config/constants";

/**
 * Standard response helpers (API.md). Every success shape is `{ data }`,
 * paginated adds `meta`, every error shape is `{ error: { code, message } }`.
 */

export type PaginatedMeta = { page: number; pageSize: number; total: number };

const DEFAULT_CODE_BY_STATUS: Record<number, ApiErrorCode> = {
  400: ERROR_CODES.VALIDATION_ERROR,
  401: ERROR_CODES.UNAUTHENTICATED,
  402: ERROR_CODES.PAYMENT_REQUIRED,
  403: ERROR_CODES.FORBIDDEN,
  404: ERROR_CODES.NOT_FOUND,
  409: ERROR_CODES.INVALID_TRANSITION,
  413: ERROR_CODES.FILE_TOO_LARGE,
  415: ERROR_CODES.UNSUPPORTED_FILE_TYPE,
  429: ERROR_CODES.RATE_LIMITED,
  500: ERROR_CODES.INTERNAL_ERROR,
};

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ data }, { status });
}

export function created<T>(data: T): Response {
  return ok(data, 201);
}

export function paginated<T>(items: T[], meta: PaginatedMeta): Response {
  return Response.json({ data: items, meta });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export function fail(
  status: number,
  message: string,
  code?: ApiErrorCode,
  details?: unknown
): Response {
  return Response.json(
    { error: { code: code ?? DEFAULT_CODE_BY_STATUS[status] ?? ERROR_CODES.INTERNAL_ERROR, message, details } },
    { status }
  );
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;

  constructor(status: number, message: string, code?: ApiErrorCode, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code ?? DEFAULT_CODE_BY_STATUS[status] ?? ERROR_CODES.INTERNAL_ERROR;
    this.details = details;
  }

  static badRequest(message = "Invalid request", details?: unknown) {
    return new ApiError(400, message, ERROR_CODES.VALIDATION_ERROR, details);
  }

  static unauthenticated(message = "You must be signed in to do that.") {
    return new ApiError(401, message, ERROR_CODES.UNAUTHENTICATED);
  }

  static forbidden(message = "You do not have access to this resource.") {
    return new ApiError(403, message, ERROR_CODES.FORBIDDEN);
  }

  static notFound(message = "Resource not found.") {
    return new ApiError(404, message, ERROR_CODES.NOT_FOUND);
  }

  static invalidTransition(message = "That status change is not allowed.") {
    return new ApiError(409, message, ERROR_CODES.INVALID_TRANSITION);
  }

  static revisionLimitReached(message = "Free revisions are used up.", details?: unknown) {
    return new ApiError(409, message, ERROR_CODES.REVISION_LIMIT_REACHED, details);
  }

  static paymentRequired(message = "Complete your payment to unlock this file.") {
    return new ApiError(402, message, ERROR_CODES.PAYMENT_REQUIRED);
  }

  static fileTooLarge(message = "The file is too large.", details?: unknown) {
    return new ApiError(413, message, ERROR_CODES.FILE_TOO_LARGE, details);
  }

  static unsupportedFileType(message = "This file type is not allowed.", details?: unknown) {
    return new ApiError(415, message, ERROR_CODES.UNSUPPORTED_FILE_TYPE, details);
  }

  static rateLimited(message = "Too many requests. Please try again shortly.", details?: unknown) {
    return new ApiError(429, message, ERROR_CODES.RATE_LIMITED, details);
  }

  static internal(message = DEFAULT_ERROR_MESSAGE) {
    return new ApiError(500, message, ERROR_CODES.INTERNAL_ERROR);
  }
}
