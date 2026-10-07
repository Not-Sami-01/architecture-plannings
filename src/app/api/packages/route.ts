import { withMiddleware } from "@/lib/api/with-middleware";
import { ok } from "@/lib/api/response";
import { listActivePackages } from "@/lib/packages";
import type { Handler } from "@/lib/api/types";

const getHandler: Handler = async () => {
  return ok(await listActivePackages());
};

export const GET = withMiddleware(getHandler, []);
