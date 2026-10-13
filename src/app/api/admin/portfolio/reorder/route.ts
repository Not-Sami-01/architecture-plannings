import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole, validateBody } from "@/lib/api/middlewares";
import { getBody } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { reorderPortfolioProjects } from "@/lib/portfolio";
import { portfolioReorderSchema, type PortfolioReorderInput } from "@/lib/validators/admin-portfolio";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

/** POST /api/admin/portfolio/reorder — full set in display order. */
const postHandler: Handler = async (req) => {
  const { ids } = getBody<PortfolioReorderInput>(req);
  return ok(await reorderPortfolioProjects(ids));
};

export const POST = withMiddleware(postHandler, [
  authenticate,
  requireRole(ROLES.ADMIN),
  validateBody(portfolioReorderSchema),
]);
