import { randomUUID } from "node:crypto";

import { PACKAGE_IMAGE, ROLES } from "@/config/constants";
import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate, requireRole } from "@/lib/api/middlewares";
import { getParam } from "@/lib/api/request";
import { ApiError, ok } from "@/lib/api/response";
import { clearPackageImage, getPackageImageKey, setPackageImage } from "@/lib/packages";
import { buildPackageImageKey, deleteObject, putObject } from "@/lib/storage";
import { packageImageFileSchema } from "@/lib/validators/admin-packages";
import type { Handler } from "@/lib/api/types";

/**
 * Pricing-card image (plan 5 A). Multipart upload that never touches the
 * client's presign flow: the cropped 1200×900 blob arrives here, is
 * re-validated server-side (mime + size — never trust the client), stored
 * under packages/{id}/, and the package points at the new key. The previous
 * object is deleted after the DB update so a failure never loses the image.
 */
const postHandler: Handler = async (req) => {
  const id = getParam(req, "id");
  const previous = await getPackageImageKey(id); // 404 when the package is gone

  const form = await req.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof File) || file.size === 0) {
    throw ApiError.badRequest("Choose an image to upload.");
  }

  const parsed = packageImageFileSchema.safeParse({
    filename: file.name,
    mime: file.type,
    size: file.size,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.code === "too_big") throw ApiError.fileTooLarge(issue.message);
    if (issue?.path.includes("mime")) throw ApiError.unsupportedFileType(PACKAGE_IMAGE.recommended);
    throw ApiError.badRequest(issue?.message ?? "Invalid image.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const key = buildPackageImageKey({
    packageId: id,
    fileId: randomUUID(),
    filename: parsed.data.filename,
  });

  await putObject(key, bytes, parsed.data.mime);
  try {
    await setPackageImage(id, key);
  } catch (error) {
    await deleteObject(key);
    throw error;
  }
  if (previous && previous !== key) {
    void deleteObject(previous);
  }

  return ok({ imageKey: key });
};

const deleteHandler: Handler = async (req) => {
  const id = getParam(req, "id");
  const previous = await getPackageImageKey(id);
  if (previous) {
    await clearPackageImage(id);
    void deleteObject(previous);
  }
  return ok({ imageKey: null });
};

export const POST = withMiddleware(postHandler, [authenticate, requireRole(ROLES.ADMIN)]);

export const DELETE = withMiddleware(deleteHandler, [authenticate, requireRole(ROLES.ADMIN)]);
