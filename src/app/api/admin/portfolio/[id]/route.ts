import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole, validateBody } from "@/lib/api/middlewares";
import { getBody, getParam } from "@/lib/api/request";
import { noContent, ok } from "@/lib/api/response";
import {
  deletePortfolioProject,
  getProjectForAdmin,
  updatePortfolioProject,
} from "@/lib/portfolio";
import {
  updatePortfolioProjectSchema,
  type UpdatePortfolioProjectInput,
} from "@/lib/validators/admin-portfolio";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

const getHandler: Handler = async (req) => {
  return ok(await getProjectForAdmin(getParam(req, "id")));
};

const patchHandler: Handler = async (req) => {
  return ok(await updatePortfolioProject(getParam(req, "id"), getBody<UpdatePortfolioProjectInput>(req)));
};

const deleteHandler: Handler = async (req) => {
  await deletePortfolioProject(getParam(req, "id"));
  return noContent();
};

export const GET = withMiddleware(getHandler, [authenticate, requireRole(ROLES.ADMIN)]);

export const PATCH = withMiddleware(patchHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateBody(updatePortfolioProjectSchema),
]);

export const DELETE = withMiddleware(deleteHandler, [authenticate, requireRole(ROLES.ADMIN)]);
