import { FILE_KINDS, FILE_LIMITS } from "@/config/constants";
import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate } from "@/lib/api/middlewares";
import { getParam, getUser } from "@/lib/api/request";
import { ApiError, ok } from "@/lib/api/response";
import { getFileForUser } from "@/lib/files";
import type { Handler } from "@/lib/api/types";

/**
 * FR-16/FR-18: the only way files leave the bucket. Checks ownership (404 for
 * strangers), gates FINAL files on verified final payment (402 otherwise), and
 * redirects to a 60-second signed URL. Storage keys are never exposed.
 */
const getHandler: Handler = async (req) => {
  const user = getUser(req);
  const fileId = getParam(req, "id");
  const file = await getFileForUser(user, fileId);

  if (file.kind === FILE_KINDS.FINAL && !file.order?.finalPaymentVerified) {
    throw ApiError.paymentRequired();
  }

  // DRAFT_ORIGINAL never goes to clients; admins use the admin file route.
  if (file.kind === FILE_KINDS.DRAFT_ORIGINAL && user.role !== "ADMIN") {
    throw ApiError.notFound();
  }

  // Local backend serves through this route; S3 issues a real signed URL.
  const { presignDownload } = await import("@/lib/storage");
  const url = await presignDownload(file.key, FILE_LIMITS.signedUrlTtlSeconds);

  return ok({ url, expiresIn: FILE_LIMITS.signedUrlTtlSeconds, filename: file.filename });
};

export const GET = withMiddleware(getHandler, [authenticate]);
