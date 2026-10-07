import { config } from "@/config/config";
import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate } from "@/lib/api/middlewares";
import { ApiError } from "@/lib/api/response";
import { getObject } from "@/lib/storage";
import type { Handler } from "@/lib/api/types";

/**
 * Local-development download streamer backing presignDownload() when no S3/R2
 * is configured. Requires a session and an unexpired signed query token.
 */
const getHandler: Handler = async (req) => {
  if (config.storage.endpoint) {
    throw ApiError.forbidden("Local download is disabled when storage is configured.");
  }

  const url = new URL(req.url);
  const key = url.searchParams.get("key") ?? "";
  const expires = Number(url.searchParams.get("expires") ?? 0);

  if (!key.startsWith("orders/") || key.includes("..") || !expires || Date.now() > expires) {
    throw ApiError.badRequest("Invalid or expired download URL.");
  }

  const object = await getObject(key);
  if (!object) throw ApiError.notFound();

  return new Response(object.body, {
    status: 200,
    headers: {
      "Content-Type": object.mime ?? "application/octet-stream",
      "Cache-Control": "private, no-store",
    },
  });
};

export const GET = withMiddleware(getHandler, [authenticate]);
