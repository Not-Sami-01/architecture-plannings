import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole, validateBody } from "@/lib/api/middlewares";
import { getBody, getParam } from "@/lib/api/request";
import { noContent, ok } from "@/lib/api/response";
import { deletePost, getPostForAdmin, updatePost } from "@/lib/posts";
import { updatePostSchema, type UpdatePostInput } from "@/lib/validators/admin-posts";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

const getHandler: Handler = async (req) => {
  return ok(await getPostForAdmin(getParam(req, "id")));
};

const patchHandler: Handler = async (req) => {
  return ok(await updatePost(getParam(req, "id"), getBody<UpdatePostInput>(req)));
};

const deleteHandler: Handler = async (req) => {
  await deletePost(getParam(req, "id"));
  return noContent();
};

export const GET = withMiddleware(getHandler, [authenticate, requireRole(ROLES.ADMIN)]);

export const PATCH = withMiddleware(patchHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateBody(updatePostSchema),
]);

export const DELETE = withMiddleware(deleteHandler, [authenticate, requireRole(ROLES.ADMIN)]);
