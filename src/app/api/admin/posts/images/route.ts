import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole } from "@/lib/api/middlewares";
import { getUser } from "@/lib/api/request";
import { created, ApiError } from "@/lib/api/response";
import { createPostImage } from "@/lib/posts";
import { ROLES } from "@/config/constants";
import type { Handler } from "@/lib/api/types";

/**
 * POST /api/admin/posts/images — multipart blog image upload (plan 6).
 * Same server-side re-validation path as the pricing-card image: the cropped
 * blob arrives here, is checked (mime + size), stored under posts/images/,
 * and returns `{ data: { id, url } }` for the TipTap image handler / cover picker.
 */
const postHandler: Handler = async (req) => {
  const user = getUser(req);

  const form = await req.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof File) || file.size === 0) {
    throw ApiError.badRequest("Choose an image to upload.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const row = await createPostImage(
    user.id,
    { name: file.name, type: file.type, size: file.size },
    bytes,
  );

  return created({ id: row.id, url: `/api/posts/images/${row.id}` });
};

export const POST = withMiddleware(postHandler, [authenticate, requireRole(ROLES.ADMIN)]);
