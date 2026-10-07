import { z } from "zod";

import { RATE_LIMITS } from "@/config/constants";
import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, rateLimit, validateBody } from "@/lib/api/middlewares";
import { getBody, getUser } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { presignForUser } from "@/lib/files";
import { FILE_KINDS, type FileKind } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

const presignSchema = z.object({
  filename: z.string().min(1).max(255),
  mime: z.string().min(3).max(100),
  size: z.number().int().positive(),
  kind: z.enum(Object.values(FILE_KINDS) as [FileKind, ...FileKind[]]),
  // Optional target order — validated in the service when provided.
  orderId: z.string().cuid().optional(),
});

const postHandler: Handler = async (req) => {
  const user = getUser(req);
  const input = getBody<z.infer<typeof presignSchema>>(req);
  const result = await presignForUser(user, input);
  return ok(result);
};

export const POST = withMiddleware(postHandler, [
  authenticate,
  rateLimit(RATE_LIMITS.presign),
  validateBody(presignSchema),
]);
