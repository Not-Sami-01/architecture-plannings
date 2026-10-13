import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole, validateBody } from "@/lib/api/middlewares";
import { getBody, getUser } from "@/lib/api/request";
import { created, ok } from "@/lib/api/response";
import { adminListProjects, createPortfolioProject } from "@/lib/portfolio";
import {
  createPortfolioProjectSchema,
  type CreatePortfolioProjectInput,
} from "@/lib/validators/admin-portfolio";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

const getHandler: Handler = async () => {
  return ok(await adminListProjects());
};

const postHandler: Handler = async (req) => {
  const user = getUser(req);
  void user;
  return created(await createPortfolioProject(getBody<CreatePortfolioProjectInput>(req)));
};

export const GET = withMiddleware(getHandler, [authenticate, requireRole(ROLES.ADMIN)]);

export const POST = withMiddleware(postHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateBody(createPortfolioProjectSchema),
]);
