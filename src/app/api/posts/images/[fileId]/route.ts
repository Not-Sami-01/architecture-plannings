import { withMiddleware } from "@/lib/api/with-middleware";
import { getParam } from "@/lib/api/request";
import { ApiError } from "@/lib/api/response";
import { getPostImageFile } from "@/lib/posts";
import { getObject } from "@/lib/storage";
import type { Handler } from "@/lib/api/types";

/**
 * Public blog image (plan 6). Only OrderFile rows of kind POST_IMAGE ever
 * resolve here, so no order file can leak through this path. The storage key
 * never leaves the server; covers render through next/image. Immutable cache —
 * uploads replace the row rather than mutate it.
 */
const getHandler: Handler = async (req) => {
  const file = await getPostImageFile(getParam(req, "fileId"));

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
