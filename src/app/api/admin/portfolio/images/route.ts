import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole } from "@/lib/api/middlewares";
import { getUser } from "@/lib/api/request";
import { created, ApiError } from "@/lib/api/response";
import { createPortfolioImage } from "@/lib/portfolio";
import { API_ROUTES, ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

/**
 * POST /api/admin/portfolio/images — multipart gallery upload (Phase 5).
 * The cropped 1200×900 blob arrives here, is re-validated server-side
 * (mime + size), stored under portfolio/images/, and returns the OrderFile
 * row id for the project's `images` array.
 */
const postHandler: Handler = async (req) => {
  const user = getUser(req);

  const form = await req.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof File) || file.size === 0) {
    throw ApiError.badRequest("Choose an image to upload.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const row = await createPortfolioImage(
    user.id,
    { name: file.name, type: file.type, size: file.size },
    bytes,
  );

  return created({ id: row.id, url: API_ROUTES.portfolioImage(row.id) });
};

export const POST = withMiddleware(postHandler, [authenticate, requireRole(ROLES.ADMIN)]);
