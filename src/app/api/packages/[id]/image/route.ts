import { withMiddleware } from "@/lib/api/with-middleware";
import { getParam } from "@/lib/api/request";
import { ApiError } from "@/lib/api/response";
import { prisma } from "@/lib/db";
import { getObject } from "@/lib/storage";
import type { Handler } from "@/lib/api/types";

/** Storage keys only ever end in the (cropped) file extension. */
function mimeFromKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

/**
 * Public pricing-card image (plan 5 A). Marketing cards render this route
 * through next/image; the object itself stays in the private bucket and the
 * key never leaves the server. No auth — packages are public catalog content.
 */
const getHandler: Handler = async (req) => {
  const id = getParam(req, "id");
  const pkg = await prisma.package.findUnique({
    where: { id },
    select: { imageKey: true },
  });
  if (!pkg?.imageKey) {
    throw ApiError.notFound("Image not found.");
  }

  const object = await getObject(pkg.imageKey);
  if (!object) {
    throw ApiError.notFound("Image not found.");
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": mimeFromKey(pkg.imageKey),
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      ...(object.size ? { "Content-Length": String(object.size) } : {}),
    },
  });
};

export const GET = withMiddleware(getHandler);
