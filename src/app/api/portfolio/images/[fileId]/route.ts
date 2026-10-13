import { withMiddleware } from "@/lib/api/with-middleware";
import { getParam } from "@/lib/api/request";
import { ApiError } from "@/lib/api/response";
import { getPortfolioImageFile } from "@/lib/portfolio";
import { getObject } from "@/lib/storage";
import type { Handler } from "@/lib/api/types";

/**
 * Public portfolio image (Phase 5). Only OrderFile rows of kind
 * PORTFOLIO_IMAGE ever resolve here, so no order file can leak through this
 * path. The storage key never leaves the server. Immutable cache — uploads
 * create fresh rows rather than mutating existing ones.
 */
const getHandler: Handler = async (req) => {
  const file = await getPortfolioImageFile(getParam(req, "fileId"));

  const object = await getObject(file.key);
  if (!object) {
    throw ApiError.notFound("Image not found.");
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      ...(object.size ? { "Content-Length": String(object.size) } : {}),
    },
  });
};

export const GET = withMiddleware(getHandler);
