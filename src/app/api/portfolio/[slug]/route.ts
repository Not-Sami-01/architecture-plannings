import { withMiddleware } from "@/lib/api/with-middleware";
import { getParam } from "@/lib/api/request";
import { ApiError, ok } from "@/lib/api/response";
import { getVisibleProjectBySlug } from "@/lib/portfolio";
import type { Handler } from "@/lib/api/types";

/** GET /api/portfolio/:slug — single visible project (404 when hidden/missing). */
const getHandler: Handler = async (req) => {
  const project = await getVisibleProjectBySlug(getParam(req, "slug"));
  if (!project) throw ApiError.notFound("Project not found.");
  return ok(project);
};

export const GET = withMiddleware(getHandler);
