import { z } from "zod";

import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, validateBody } from "@/lib/api/middlewares";
import { getBody, getUser } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { confirmUpload } from "@/lib/files";
import type { Handler } from "@/lib/api/types";

const confirmSchema = z.object({
  fileId: z.string().cuid2(),
});

const postHandler: Handler = async (req) => {
  const user = getUser(req);
  const { fileId } = getBody<z.infer<typeof confirmSchema>>(req);
  const file = await confirmUpload(user, { fileId });
  return ok({
    id: file.id,
    filename: file.filename,
    size: file.size,
    mime: file.mime,
  });
};

export const POST = withMiddleware(postHandler, [
  authenticate,
  validateBody(confirmSchema),
]);
