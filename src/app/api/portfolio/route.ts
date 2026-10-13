import { withMiddleware } from "@/lib/api/with-middleware";
import { validateQuery } from "@/lib/api/middlewares";
import { getQuery } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { listVisibleProjects } from "@/lib/portfolio";
import { portfolioListQuerySchema, type PortfolioListQuery } from "@/lib/validators/admin-portfolio";
import type { Handler } from "@/lib/api/types";

/** GET /api/portfolio — visible projects with optional plot/style/category filters. */
const getHandler: Handler = async (req) => {
  return ok(await listVisibleProjects(getQuery<PortfolioListQuery>(req)));
};

export const GET = withMiddleware(getHandler, [validateQuery(portfolioListQuerySchema)]);
