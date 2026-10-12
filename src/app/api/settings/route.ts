import { withMiddleware } from "@/lib/api/with-middleware";
import { ok } from "@/lib/api/response";
import { getSiteSettings } from "@/lib/settings";
import type { Handler } from "@/lib/api/types";

// Public app settings (plan 3): the currency powers every money label.
// Rate-limited by the defaults; nothing sensitive is exposed.
const getHandler: Handler = async () => ok(await getSiteSettings());

export const GET = withMiddleware(getHandler, []);
