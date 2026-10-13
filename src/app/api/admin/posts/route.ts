import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole, validateBody, validateQuery } from "@/lib/api/middlewares";
import { getBody, getQuery, getUser } from "@/lib/api/request";
import { created, paginated } from "@/lib/api/response";
import { adminListPosts, createPost } from "@/lib/posts";
import {
  createPostSchema,
  postListQuerySchema,
  type CreatePostInput,
  type PostListQuery,
} from "@/lib/validators/admin-posts";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

const getHandler: Handler = async (req) => {
  const { items, meta } = await adminListPosts(getQuery<PostListQuery>(req));
  return paginated(items, meta);
};

const postHandler: Handler = async (req) => {
  const user = getUser(req);
  return created(await createPost(user.id, getBody<CreatePostInput>(req)));
};

export const GET = withMiddleware(getHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateQuery(postListQuerySchema),
]);

export const POST = withMiddleware(postHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateBody(createPostSchema),
]);
