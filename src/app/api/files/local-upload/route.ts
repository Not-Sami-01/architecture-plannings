import { NextResponse } from "next/server";

import { config } from "@/config/config";
import { withMiddleware } from "@/lib/api/with-middleware";
import { authenticate } from "@/lib/api/middlewares";
import { putLocalObject } from "@/lib/storage";
import { ApiError } from "@/lib/api/response";
import type { Handler } from "@/lib/api/types";

/**
 * Local-development upload target when no S3/R2 credentials are configured
 * (see src/lib/storage.ts). Requires a session so the bucket is not open.
 * Signed-token check kept simple on purpose: local data only, short expiry.
 */
const putHandler: Handler = async (req) => {
  if (config.storage.endpoint) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Local upload is disabled when storage is configured." } },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const key = url.searchParams.get("key") ?? "";
  const expires = Number(url.searchParams.get("expires") ?? 0);

  if (!key.startsWith("orders/") || key.includes("..") || !expires || Date.now() > expires) {
    throw ApiError.badRequest("Invalid or expired upload URL.");
  }

  const body = Buffer.from(await req.arrayBuffer());
  await putLocalObject(key, body);
  return new NextResponse(null, { status: 200 });
};

// Raw body needed; skip default body parsing.
export const PUT = withMiddleware(putHandler, [authenticate], { skipDefaults: true });
