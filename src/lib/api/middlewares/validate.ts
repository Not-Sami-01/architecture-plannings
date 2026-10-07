import { ERROR_CODES } from "@/config/constants";
import type { z } from "zod";

import { pass, reject } from "./helpers";
import type { Middleware } from "../types";

const toDetails = (error: z.ZodError) =>
  error.issues.map((issue) => ({ path: issue.path, message: issue.message }));

/** Validates the JSON body; sets `req.ctx.body` to the parsed (typed) value. */
export function validateBody<Schema extends z.ZodType>(schema: Schema): Middleware {
  return async (req, res) => {
    const result = schema.safeParse(req.ctx.body);

    if (!result.success) {
      return reject(req, res, 400, "The submitted data is invalid.", {
        code: ERROR_CODES.VALIDATION_ERROR,
        details: toDetails(result.error),
      });
    }

    req.ctx.body = result.data;
    return pass(req, res);
  };
}

/** Validates the query string; sets `req.ctx.query` to the parsed (typed) value. */
export function validateQuery<Schema extends z.ZodType>(schema: Schema): Middleware {
  return async (req, res) => {
    const result = schema.safeParse(req.ctx.query);

    if (!result.success) {
      return reject(req, res, 400, "The query parameters are invalid.", {
        code: ERROR_CODES.VALIDATION_ERROR,
        details: toDetails(result.error),
      });
    }

    // Query outputs are parsed records (possibly coerced); ctx.query is the
    // broad bag type on purpose so getQuery<T>() casts once at the edge.
    req.ctx.query = result.data as Record<string, unknown>;
    return pass(req, res);
  };
}
