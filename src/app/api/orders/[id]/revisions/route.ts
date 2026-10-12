import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, validateBody } from "@/lib/api/middlewares";
import { getBody, getParam, getUser } from "@/lib/api/request";
import { created, ok } from "@/lib/api/response";
import { listRevisions, requestRevision } from "@/lib/revisions";
import {
  revisionRequestSchema,
  type RevisionRequestInput,
} from "@/lib/validators/revisions";
import type { Handler } from "@/lib/api/types";

const getHandler: Handler = async (req) => {
  const user = getUser(req);
  return ok(await listRevisions(user, getParam(req, "id")));
};

const postHandler: Handler = async (req) => {
  const user = getUser(req);
  return created(
    await requestRevision(user, getParam(req, "id"), getBody<RevisionRequestInput>(req)),
  );
};

export const GET = withMiddleware(getHandler, [authenticate]);
export const POST = withMiddleware(postHandler, [
  authenticate,
  validateBody(revisionRequestSchema),
]);
